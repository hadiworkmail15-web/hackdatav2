import type {
  AIService,
  SchemaAnalysis,
  GenerationPlan,
  EdgeCaseSuggestions,
} from '@/types/ai';
import type { TableSchema, ColumnSchema, DataSchema } from '@/types/schema';

/**
 * AI Service — Gemini Integration
 *
 * Calls a Supabase Edge Function (supabase/functions/ai-analyze) that proxies
 * requests to the Gemini API. The GEMINI_API_KEY is stored server-side as a
 * Supabase secret and is NEVER exposed to the browser.
 *
 * If the key is missing, the edge function returns a 503 with a clear message.
 */

interface GeminiAnalysisResponse {
  summary: string;
  columns: Array<{
    name: string;
    semanticType: string;
    role: 'primary_key' | 'foreign_key' | 'attribute' | 'metadata';
    notes: string;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    description: string;
  }>;
  constraints: string[];
  recommendations: string[];
  edgeCases: Array<{
    column: string;
    type: 'null' | 'boundary' | 'extreme' | 'unusual_valid' | 'rare_category';
    description: string;
    example: string;
  }>;
}

function toColumns(schema: TableSchema | TableSchema[] | DataSchema): ColumnSchema[] {
  if ('tables' in schema && Array.isArray(schema.tables)) {
    return schema.tables.flatMap((t) => t.columns);
  }
  if (Array.isArray(schema)) {
    return schema.flatMap((t) => t.columns);
  }
  if ('columns' in schema) {
    return schema.columns;
  }
  return [];
}

function buildPlanFromColumns(columns: ColumnSchema[]): GenerationPlan {
  return {
    columns: columns.map((col) => {
      const plan: GenerationPlan['columns'][number] = {
        name: col.name,
        generator: col.semanticType ?? col.dataType,
      };

      const sem = col.semanticType ?? '';
      if (sem === 'age') {
        plan.realisticRange = { min: 18, max: 75 };
        plan.distribution = 'normal';
        plan.edgeCases = ['minors (age < 18)', 'elderly (age > 85)'];
      }
      if (sem === 'currency') {
        plan.realisticRange = { min: 1, max: 10000 };
        plan.distribution = 'exponential';
        plan.edgeCases = ['micro-transactions (< $1)', 'large payments (> $50000)'];
      }
      if (sem === 'integer') {
        plan.realisticRange = { min: col.min ?? 1, max: col.max ?? 1000 };
        plan.distribution = 'uniform';
      }
      if (sem === 'decimal') {
        plan.realisticRange = { min: col.min ?? 0.01, max: col.max ?? 10000 };
        plan.distribution = 'uniform';
      }
      if (sem === 'category' && col.allowedValues) {
        plan.distribution = 'categorical';
        plan.categoricalValues = col.allowedValues;
        plan.edgeCases = [`rare category: ${col.allowedValues[col.allowedValues.length - 1]}`];
      }
      if (col.foreignKey) {
        plan.dependencies = [`${col.foreignKey.table}.${col.foreignKey.column}`];
      }

      return plan;
    }),
    notes: [
      'Use deterministic seeding for reproducible output',
      'Apply null rate after primary key generation to maintain uniqueness',
      'Foreign keys resolved after parent tables are generated',
    ],
  };
}

export function createAIService(): AIService {
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analyze`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };

  async function callGemini(schema: TableSchema | TableSchema[]): Promise<GeminiAnalysisResponse> {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ schema }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
      const message = errorBody.error || `Request failed (${response.status})`;
      if (response.status === 503) {
        throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in your Supabase project secrets.');
      }
      throw new Error(message);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data as GeminiAnalysisResponse;
  }

  return {
    async analyzeSchema(schema: TableSchema | TableSchema[]): Promise<SchemaAnalysis> {
      const geminiResult = await callGemini(schema);
      return {
        summary: geminiResult.summary,
        columns: geminiResult.columns,
        relationships: geminiResult.relationships,
        constraints: geminiResult.constraints,
        recommendations: geminiResult.recommendations,
      };
    },

    async createGenerationPlan(schema: TableSchema | TableSchema[]): Promise<GenerationPlan> {
      // The generation plan is derived locally from the schema columns.
      // Gemini's recommendations are surfaced through the analysis panel.
      const columns = toColumns(schema);
      return buildPlanFromColumns(columns);
    },

    async suggestEdgeCases(schema: TableSchema | TableSchema[]): Promise<EdgeCaseSuggestions> {
      // Edge cases come from the same Gemini call as the analysis.
      // Since we already called analyzeSchema, we re-fetch the edge cases
      // from the Gemini response. To avoid a duplicate call, we fetch once
      // and extract edge cases.
      const geminiResult = await callGemini(schema);
      return {
        edgeCases: geminiResult.edgeCases,
        summary: `Gemini identified ${geminiResult.edgeCases.length} edge cases across the schema.`,
      };
    },

    // We can't know at construction time if the key is configured without
    // making a network call. We expose this as true so the UI doesn't
    // block the button — the actual error is surfaced when the call runs.
    isConfigured: true,
  };
}
