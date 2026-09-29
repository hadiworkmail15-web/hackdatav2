import { useState, useCallback } from 'react';
import {
  Table2,
  Network,
  FileText,
  Play,
  FileJson,
  FileSpreadsheet,
  Package,
  Sparkles,
  Zap,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState, Spinner } from '@/components/ui/States';
import { SchemaBuilder } from '@/components/schema/SchemaBuilder';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AIAnalysisPanel } from '@/components/AIAnalysisPanel';
import { ValidationPanel } from '@/components/ValidationPanel';
import { StatsBar } from '@/components/StatsBar';
import { generateRows } from '@/lib/tabular-generator';
import { generateRelationalData } from '@/lib/relational-generator';
import { validateTables, summarizeValidation } from '@/lib/validation';
import { createAIService } from '@/lib/ai-service';
import { ECOMMERCE_DEMO_SCHEMA, DEMO_TABULAR_TABLE, createEmptySchema, resetIdCounter } from '@/lib/schema/demoSchema';
import { tableToCSV, rowsToJSON, tablesToJSON, tablesToCSVMap, buildZip, downloadText, downloadBlob } from '@/lib/export';
import { DEFAULT_SETTINGS, type GenerationSettings, type DataSchema, type TableSchema } from '@/types/schema';
import type { GeneratedTable, ValidationResult, GenerationStats } from '@/types/generation';
import type { SchemaAnalysis, GenerationPlan, EdgeCaseSuggestions } from '@/types/ai';

type Mode = 'tabular' | 'relational' | 'documents';

interface WorkspaceProps {
  initialMode?: Mode;
  onNavigateDocuments: () => void;
}

export function GeneratorWorkspace({ initialMode = 'tabular', onNavigateDocuments }: WorkspaceProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [schema, setSchema] = useState<DataSchema>(() => ({
    ...createEmptySchema(),
    name: 'Tabular Schema',
    tables: [DEMO_TABULAR_TABLE],
  }));
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [generated, setGenerated] = useState<GeneratedTable[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>();
  const [aiAnalysis, setAiAnalysis] = useState<SchemaAnalysis | undefined>();
  const [aiPlan, setAiPlan] = useState<GenerationPlan | undefined>();
  const [aiEdgeCases, setAiEdgeCases] = useState<EdgeCaseSuggestions | undefined>();
  const [activeTable, setActiveTable] = useState(0);

  const aiService = createAIService();

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setAiError(undefined);
    try {
      const schemaForAI: TableSchema | TableSchema[] =
        mode === 'relational' ? schema.tables : schema.tables[0] ?? schema.tables;
      // Call Gemini once for analysis + edge cases, derive plan locally
      const [analysis, edgeCases] = await Promise.all([
        aiService.analyzeSchema(schemaForAI),
        aiService.suggestEdgeCases(schemaForAI),
      ]);
      const plan = await aiService.createGenerationPlan(schemaForAI);
      setAiAnalysis(analysis);
      setAiPlan(plan);
      setAiEdgeCases(edgeCases);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to analyze schema with Gemini.');
      setAiAnalysis(undefined);
      setAiPlan(undefined);
      setAiEdgeCases(undefined);
    } finally {
      setAnalyzing(false);
    }
  }, [schema, mode, aiService]);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const start = performance.now();
      let tables: GeneratedTable[] = [];

      if (mode === 'relational') {
        tables = generateRelationalData(schema, settings);
      } else {
        const firstTable = schema.tables[0];
        if (firstTable) {
          const rows = generateRows(firstTable.columns, settings);
          tables = [{ schema: firstTable, rows }];
        }
      }

      const validationResults = validateTables(tables, settings);
      const duration = performance.now() - start;

      const totalRows = tables.reduce((sum, t) => sum + t.rows.length, 0);
      const nullCount = tables.reduce(
        (sum, t) => sum + t.rows.reduce(
          (s, r) => s + Object.values(r).filter((v) => v === null).length,
          0,
        ),
        0,
      );
      const totalCells = tables.reduce((sum, t) => sum + t.rows.length * t.schema.columns.length, 0);
      const actualNullRate = totalCells > 0 ? (nullCount / totalCells) * 100 : 0;

      const genStats: GenerationStats = {
        rowsGenerated: totalRows,
        tables: tables.length,
        relationships: mode === 'relational' ? schema.relationships.length : 0,
        nullRate: Math.round(actualNullRate * 10) / 10,
        outlierRate: settings.outlierRate,
        validationStatus: summarizeValidation(validationResults),
        durationMs: Math.round(duration),
      };

      setGenerated(tables);
      setValidation(validationResults);
      setStats(genStats);
      setActiveTable(0);
      setGenerating(false);
    }, 300);
  }, [mode, schema, settings]);

  const handleLoadDemo = () => {
    resetIdCounter();
    if (mode === 'relational') {
      setSchema({ ...ECOMMERCE_DEMO_SCHEMA });
    } else {
      setSchema({
        ...createEmptySchema(),
        name: 'Tabular Schema',
        tables: [DEMO_TABULAR_TABLE],
      });
    }
    setGenerated(null);
    setValidation([]);
    setStats(null);
  };

  const handleGenerateDemo = () => {
    resetIdCounter();
    if (mode === 'relational') {
      setSchema({ ...ECOMMERCE_DEMO_SCHEMA });
      setSettings(DEFAULT_SETTINGS);
      setTimeout(() => {
        const start = performance.now();
        const tables = generateRelationalData(ECOMMERCE_DEMO_SCHEMA, DEFAULT_SETTINGS);
        const validationResults = validateTables(tables, DEFAULT_SETTINGS);
        const duration = performance.now() - start;
        const totalRows = tables.reduce((sum, t) => sum + t.rows.length, 0);
        setGenerated(tables);
        setValidation(validationResults);
        setStats({
          rowsGenerated: totalRows,
          tables: tables.length,
          relationships: ECOMMERCE_DEMO_SCHEMA.relationships.length,
          nullRate: DEFAULT_SETTINGS.nullRate,
          outlierRate: DEFAULT_SETTINGS.outlierRate,
          validationStatus: summarizeValidation(validationResults),
          durationMs: Math.round(duration),
        });
        setActiveTable(0);
      }, 100);
    } else {
      setSchema({
        ...createEmptySchema(),
        name: 'Tabular Schema',
        tables: [DEMO_TABULAR_TABLE],
      });
      setSettings(DEFAULT_SETTINGS);
      setTimeout(() => {
        const start = performance.now();
        const rows = generateRows(DEMO_TABULAR_TABLE.columns, DEFAULT_SETTINGS);
        const tables: GeneratedTable[] = [{ schema: DEMO_TABULAR_TABLE, rows }];
        const validationResults = validateTables(tables, DEFAULT_SETTINGS);
        const duration = performance.now() - start;
        setGenerated(tables);
        setValidation(validationResults);
        setStats({
          rowsGenerated: rows.length,
          tables: 1,
          relationships: 0,
          nullRate: DEFAULT_SETTINGS.nullRate,
          outlierRate: DEFAULT_SETTINGS.outlierRate,
          validationStatus: summarizeValidation(validationResults),
          durationMs: Math.round(duration),
        });
      }, 100);
    }
  };

  const handleExportCSV = () => {
    if (!generated) return;
    if (mode === 'relational' && generated.length > 1) {
      const csvMap = tablesToCSVMap(generated);
      const blob = buildZip(csvMap);
      downloadBlob(blob, 'synthforge-relational.zip');
    } else {
      downloadText(tableToCSV(generated[0]), `${generated[0].schema.name}.csv`, 'text/csv');
    }
  };

  const handleExportJSON = () => {
    if (!generated) return;
    if (generated.length > 1) {
      downloadText(tablesToJSON(generated), 'synthforge-dataset.json', 'application/json');
    } else {
      downloadText(rowsToJSON(generated[0].rows), `${generated[0].schema.name}.json`, 'application/json');
    }
  };

  const currentTable = generated?.[activeTable];
  const previewRows = currentTable?.rows ?? [];
  const previewCols = currentTable?.schema.columns ?? [];

  const sidebarItems = [
    { id: 'tabular' as Mode, label: 'Tabular', icon: <Table2 className="w-4 h-4" /> },
    { id: 'relational' as Mode, label: 'Relational', icon: <Network className="w-4 h-4" /> },
    { id: 'documents' as Mode, label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Top bar */}
      <header className="border-b border-default bg-surface px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent)))' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-default text-sm">Generator Workspace</h1>
            <p className="text-xs text-muted">Schema → Generate → Validate → Export</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleLoadDemo} variant="ghost" size="sm">Load Demo Schema</Button>
          <Button onClick={handleGenerateDemo} variant="secondary" size="sm">
            <Zap className="w-3.5 h-3.5" />
            Generate Demo Dataset
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 border-r border-default bg-surface p-3 shrink-0">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id === 'documents' ? onNavigateDocuments() : setMode(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === item.id
                    ? 'text-white'
                    : 'text-muted hover:bg-surface-2 hover:text-default'
                }`}
                style={mode === item.id ? { backgroundColor: 'rgb(var(--primary))' } : {}}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <p className="text-xs font-semibold text-muted mb-1">AI Status</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="text-xs text-muted">Gemini API</span>
            </div>
            <p className="text-[10px] text-muted mt-2 leading-relaxed">
              Powered by Gemini via server-side edge function. Set GEMINI_API_KEY in Supabase secrets.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Mode-specific header for relational */}
            {mode === 'relational' && schema.tables.length > 1 && (
              <Card>
                <CardHeader
                  title={schema.name}
                  subtitle="Customers → Orders → Order Items (dependency-ordered generation)"
                  icon={<Network className="w-5 h-5" style={{ color: 'rgb(var(--accent))' }} />}
                />
                <div className="flex items-center gap-4 flex-wrap">
                  {schema.tables.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3">
                      <div className="card px-3 py-2" style={{ borderColor: 'rgb(var(--accent))' }}>
                        <p className="text-xs font-semibold text-default">{t.name}</p>
                        <p className="text-[10px] text-muted">{t.columns.length} columns</p>
                      </div>
                      {i < schema.tables.length - 1 && (
                        <span className="text-xs font-bold" style={{ color: 'rgb(var(--accent))' }}>1:N →</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Schema builder */}
            <Card>
              <CardHeader
                title="Schema Configuration"
                subtitle={mode === 'relational' ? 'Multi-table schema with relationships' : 'Define columns with semantic types and constraints'}
                icon={<Table2 className="w-5 h-5" style={{ color: 'rgb(var(--primary))' }} />}
              />
              <SchemaBuilder
                schema={schema}
                onChange={setSchema}
                onAnalyze={handleAnalyze}
                analyzing={analyzing}
              />
            </Card>

            {/* Settings */}
            <SettingsPanel settings={settings} onChange={setSettings} />

            {/* Generate button */}
            <div className="flex items-center gap-3">
              <Button onClick={handleGenerate} size="lg" loading={generating} className="flex-1">
                {!generating && <Play className="w-4 h-4" />}
                {generating ? 'Generating...' : `Generate ${settings.rowCount.toLocaleString()} Rows`}
              </Button>
            </div>

            {/* Stats */}
            {stats && <StatsBar stats={stats} />}

            {/* Two column: preview + validation */}
            <div className="grid lg:grid-cols-3 gap-5">
              {/* Preview - spans 2 cols */}
              <div className="lg:col-span-2 space-y-4">
                <Card padding="none">
                  <div className="p-5 border-b border-default">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-default text-sm">Live Preview</h4>
                      {generated && generated.length > 1 && (
                        <div className="flex items-center gap-1">
                          {generated.map((t, i) => (
                            <button
                              key={t.schema.id}
                              onClick={() => setActiveTable(i)}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                activeTable === i ? 'text-white' : 'text-muted hover:bg-surface-2'
                              }`}
                              style={activeTable === i ? { backgroundColor: 'rgb(var(--primary))' } : {}}
                            >
                              {t.schema.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    {generating ? (
                      <Spinner label="Generating data..." />
                    ) : generated && currentTable ? (
                      <>
                        <DataTable rows={previewRows} columns={previewCols} maxRows={20} />
                        <p className="text-xs text-muted mt-3 text-center">
                          Showing {Math.min(20, previewRows.length)} of {previewRows.length.toLocaleString()} rows
                        </p>
                      </>
                    ) : (
                      <EmptyState
                        icon={<Table2 className="w-8 h-8 text-muted" />}
                        title="No data generated yet"
                        description="Configure your schema and click Generate to produce synthetic data."
                        action={<Button onClick={handleGenerateDemo} variant="secondary" size="sm">
                          <Zap className="w-3.5 h-3.5" />
                          Generate Demo Dataset
                        </Button>}
                      />
                    )}
                  </div>
                </Card>

                {/* Export controls */}
                {generated && (
                  <Card>
                    <h4 className="font-semibold text-default text-sm mb-3">Export</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button onClick={handleExportCSV} variant="secondary" size="sm">
                        {mode === 'relational' && generated.length > 1 ? (
                          <>
                            <Package className="w-3.5 h-3.5" />
                            Download CSV ZIP
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Download CSV
                          </>
                        )}
                      </Button>
                      <Button onClick={handleExportJSON} variant="secondary" size="sm">
                        <FileJson className="w-3.5 h-3.5" />
                        Download JSON
                      </Button>
                      {stats && (
                        <span className="text-xs text-muted ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Generated in {stats.durationMs}ms
                        </span>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right column: AI + Validation */}
              <div className="space-y-4">
                <AIAnalysisPanel loading={analyzing} error={aiError} analysis={aiAnalysis} plan={aiPlan} edgeCases={aiEdgeCases} />
                <ValidationPanel results={validation} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
