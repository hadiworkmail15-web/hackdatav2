import type { ColumnDefinition, TableSchema } from './schema';

export interface SchemaAnalysis {
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
}

export interface GenerationPlan {
  columns: Array<{
    name: string;
    generator: string;
    realisticRange?: { min: number; max: number };
    distribution?: 'uniform' | 'normal' | 'exponential' | 'categorical';
    categoricalValues?: string[];
    dependencies?: string[];
    edgeCases?: string[];
  }>;
  notes: string[];
}

export interface EdgeCaseSuggestions {
  edgeCases: Array<{
    column: string;
    type: 'null' | 'boundary' | 'extreme' | 'unusual_valid' | 'rare_category';
    description: string;
    example: string;
  }>;
  summary: string;
}

export interface AIService {
  analyzeSchema(schema: TableSchema | TableSchema[]): Promise<SchemaAnalysis>;
  createGenerationPlan(schema: TableSchema | TableSchema[]): Promise<GenerationPlan>;
  suggestEdgeCases(schema: TableSchema | TableSchema[]): Promise<EdgeCaseSuggestions>;
  isConfigured: boolean;
}
