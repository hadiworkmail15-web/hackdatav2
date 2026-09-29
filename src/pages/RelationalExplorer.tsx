import { useState, useCallback } from 'react';
import {
  Network,
  ArrowRight,
  Play,
  Download,
  Package,
  FileJson,
  Zap,
  Key,
  Link2,
  Users,
  ShoppingCart,
  Package2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState, Spinner } from '@/components/ui/States';
import { StatsBar } from '@/components/StatsBar';
import { ValidationPanel } from '@/components/ValidationPanel';
import { generateRelationalData } from '@/lib/relational-generator';
import { validateTables, summarizeValidation } from '@/lib/validation';
import { tablesToCSVMap, buildZip, downloadBlob, tablesToJSON, downloadText } from '@/lib/export';
import { ECOMMERCE_DEMO_SCHEMA, resetIdCounter } from '@/lib/schema/demoSchema';
import { DEFAULT_SETTINGS, type GenerationSettings } from '@/types/schema';
import type { GeneratedTable, ValidationResult, GenerationStats } from '@/types/generation';

const TABLE_ICONS: Record<string, React.ReactNode> = {
  customers: <Users className="w-4 h-4" />,
  orders: <ShoppingCart className="w-4 h-4" />,
  order_items: <Package2 className="w-4 h-4" />,
};

interface RelationalExplorerProps {
  onBack: () => void;
}

export function RelationalExplorer({ onBack }: RelationalExplorerProps) {
  const [settings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [generated, setGenerated] = useState<GeneratedTable[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [activeTable, setActiveTable] = useState(0);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      resetIdCounter();
      const start = performance.now();
      const tables = generateRelationalData(ECOMMERCE_DEMO_SCHEMA, settings);
      const validationResults = validateTables(tables, settings);
      const duration = performance.now() - start;
      const totalRows = tables.reduce((sum, t) => sum + t.rows.length, 0);

      setGenerated(tables);
      setValidation(validationResults);
      setStats({
        rowsGenerated: totalRows,
        tables: tables.length,
        relationships: ECOMMERCE_DEMO_SCHEMA.relationships.length,
        nullRate: settings.nullRate,
        outlierRate: settings.outlierRate,
        validationStatus: summarizeValidation(validationResults),
        durationMs: Math.round(duration),
      });
      setActiveTable(0);
      setGenerating(false);
    }, 300);
  }, [settings]);

  const handleExportZip = () => {
    if (!generated) return;
    const csvMap = tablesToCSVMap(generated);
    const blob = buildZip(csvMap);
    downloadBlob(blob, 'synthforge-relational.zip');
  };

  const handleExportJSON = () => {
    if (!generated) return;
    downloadText(tablesToJSON(generated), 'synthforge-relational.json', 'application/json');
  };

  const currentTable = generated?.[activeTable];

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Top bar */}
      <header className="border-b border-default bg-surface px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost text-sm">← Back</button>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--primary)))' }}>
            <Network className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-default text-sm">Relational Data Explorer</h1>
            <p className="text-xs text-muted">{ECOMMERCE_DEMO_SCHEMA.name} — enforced foreign keys</p>
          </div>
        </div>
        <Button onClick={handleGenerate} size="sm" loading={generating}>
          {!generating && <Play className="w-3.5 h-3.5" />}
          Generate
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Relationship diagram */}
          <Card>
            <CardHeader
              title="Relationship Diagram"
              subtitle="Foreign keys guarantee referential integrity"
              icon={<Network className="w-5 h-5" style={{ color: 'rgb(var(--accent))' }} />}
            />
            <div className="flex items-center justify-center gap-3 py-4 flex-wrap">
              {ECOMMERCE_DEMO_SCHEMA.tables.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="card p-4 min-w-[160px]" style={{ borderColor: 'rgb(var(--accent))' }}>
                    <div className="flex items-center gap-2 mb-2">
                      {TABLE_ICONS[t.name]}
                      <span className="font-semibold text-default text-sm">{t.name}</span>
                    </div>
                    <div className="space-y-1">
                      {t.columns.map((c) => (
                        <div key={c.id} className="flex items-center gap-1 text-xs">
                          {c.primaryKey && <Key className="w-2.5 h-2.5" style={{ color: 'rgb(var(--primary))' }} />}
                          {c.foreignKey && <Link2 className="w-2.5 h-2.5" style={{ color: 'rgb(var(--accent))' }} />}
                          <span className="font-mono text-muted">{c.name}</span>
                          <span className="text-muted/50 text-[10px]">{c.dataType}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {i < ECOMMERCE_DEMO_SCHEMA.tables.length - 1 && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold" style={{ color: 'rgb(var(--accent))' }}>1:N</span>
                      <ArrowRight className="w-5 h-5" style={{ color: 'rgb(var(--accent))' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Relationships list */}
            <div className="mt-4 pt-4 border-t border-default">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Relationships</p>
              <div className="space-y-2">
                {ECOMMERCE_DEMO_SCHEMA.relationships.map((rel) => (
                  <div key={rel.id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-default">{rel.fromTable}.{rel.fromColumn}</span>
                    <ArrowRight className="w-3 h-3" style={{ color: 'rgb(var(--accent))' }} />
                    <span className="badge" style={{ backgroundColor: 'rgba(45 212 191 / 0.1)', color: 'rgb(var(--accent))' }}>
                      {rel.type}
                    </span>
                    <ArrowRight className="w-3 h-3" style={{ color: 'rgb(var(--accent))' }} />
                    <span className="font-mono text-default">{rel.toTable}.{rel.toColumn}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Stats */}
          {stats && <StatsBar stats={stats} />}

          {/* Generate demo button */}
          {!generated && !generating && (
            <Card>
              <EmptyState
                icon={<Network className="w-8 h-8 text-muted" />}
                title="No relational data generated yet"
                description="Click Generate to produce customers, orders, and order items with enforced foreign keys and reconciled totals."
                action={
                  <Button onClick={handleGenerate} variant="secondary" size="sm">
                    <Zap className="w-3.5 h-3.5" />
                    Generate Demo Dataset
                  </Button>
                }
              />
            </Card>
          )}

          {generating && <Card><Spinner label="Generating relational data..." /></Card>}

          {/* Table explorer */}
          {generated && currentTable && (
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                {/* Table tabs */}
                <div className="flex items-center gap-2">
                  {generated.map((t, i) => (
                    <button
                      key={t.schema.id}
                      onClick={() => setActiveTable(i)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTable === i ? 'text-white' : 'card text-muted hover:text-default'
                      }`}
                      style={activeTable === i ? { backgroundColor: 'rgb(var(--primary))' } : {}}
                    >
                      {TABLE_ICONS[t.schema.name]}
                      {t.schema.name}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${activeTable === i ? 'bg-white/20' : ''}`}>
                        {t.rows.length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Table data */}
                <Card padding="none">
                  <div className="p-4 border-b border-default">
                    <h4 className="font-semibold text-default text-sm">
                      {currentTable.schema.name} — {currentTable.rows.length.toLocaleString()} rows
                    </h4>
                  </div>
                  <div className="p-4">
                    <DataTable rows={currentTable.rows} columns={currentTable.schema.columns} maxRows={20} />
                    <p className="text-xs text-muted mt-3 text-center">
                      Showing {Math.min(20, currentTable.rows.length)} of {currentTable.rows.length.toLocaleString()} rows
                    </p>
                  </div>
                </Card>

                {/* Export */}
                <Card>
                  <h4 className="font-semibold text-default text-sm mb-3">Export Relational Data</h4>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleExportZip} variant="secondary" size="sm">
                      <Package className="w-3.5 h-3.5" />
                      Download CSV ZIP (3 files)
                    </Button>
                    <Button onClick={handleExportJSON} variant="secondary" size="sm">
                      <FileJson className="w-3.5 h-3.5" />
                      Download JSON
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Validation */}
              <div>
                <ValidationPanel results={validation} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
