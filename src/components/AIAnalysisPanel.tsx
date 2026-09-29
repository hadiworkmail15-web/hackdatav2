import { Sparkles, Key, Link2, AlertTriangle, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import type { SchemaAnalysis, GenerationPlan, EdgeCaseSuggestions } from '@/types/ai';

interface AIAnalysisPanelProps {
  loading: boolean;
  error?: string;
  analysis?: SchemaAnalysis;
  plan?: GenerationPlan;
  edgeCases?: EdgeCaseSuggestions;
}

export function AIAnalysisPanel({ loading, error, analysis, plan, edgeCases }: AIAnalysisPanelProps) {
  if (loading) {
    return <Card><Spinner label="Gemini analyzing schema..." /></Card>;
  }

  if (error) {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgb(var(--error-light))' }}>
            <AlertCircle className="w-6 h-6" style={{ color: 'rgb(var(--error))' }} />
          </div>
          <p className="text-sm font-semibold text-default mb-1">Analysis Failed</p>
          <p className="text-xs text-muted max-w-xs">{error}</p>
        </div>
      </Card>
    );
  }

  if (!analysis && !plan && !edgeCases) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <Sparkles className="w-6 h-6 text-muted" />
          </div>
          <p className="text-sm text-muted">Click "Analyze Schema with AI" to get Gemini-powered recommendations, generation plans, and edge-case detection.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {analysis && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: 'rgb(var(--primary))' }} />
            <h4 className="font-semibold text-default text-sm">Schema Analysis</h4>
          </div>
          <p className="text-xs text-muted mb-4">{analysis.summary}</p>

          <div className="space-y-1.5 mb-4">
            {analysis.columns.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-default">{c.name}</span>
                <Badge variant={c.role === 'primary_key' ? 'primary' : c.role === 'foreign_key' ? 'accent' : 'default'}>
                  {c.role === 'primary_key' && <Key className="w-3 h-3" />}
                  {c.role === 'foreign_key' && <Link2 className="w-3 h-3" />}
                  {c.role}
                </Badge>
                <span className="text-muted truncate">{c.notes}</span>
              </div>
            ))}
          </div>

          {analysis.relationships.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Relationships</p>
              {analysis.relationships.map((r, i) => (
                <div key={i} className="text-xs text-muted mb-1">
                  <span className="font-mono text-default">{r.from}</span>
                  <span className="mx-1">→</span>
                  <span className="font-mono text-default">{r.to}</span>
                  <span className="text-muted ml-1">({r.type})</span>
                </div>
              ))}
            </div>
          )}

          {analysis.constraints.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Constraints</p>
              {analysis.constraints.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted mb-1">
                  <CheckCircle2 className="w-3 h-3" style={{ color: 'rgb(var(--success))' }} />
                  {c}
                </div>
              ))}
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Recommendations</p>
              {analysis.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-muted mb-1">
                  <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'rgb(var(--warning))' }} />
                  {r}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {plan && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: 'rgb(var(--accent))' }} />
            <h4 className="font-semibold text-default text-sm">Generation Plan</h4>
          </div>
          <div className="space-y-1.5 mb-3">
            {plan.columns.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-default w-28 truncate">{c.name}</span>
                <Badge variant="primary">{c.generator}</Badge>
                {c.distribution && <Badge>{c.distribution}</Badge>}
                {c.realisticRange && (
                  <span className="text-muted">
                    [{c.realisticRange.min}, {c.realisticRange.max}]
                  </span>
                )}
              </div>
            ))}
          </div>
          {plan.notes.map((n, i) => (
            <div key={i} className="text-xs text-muted flex items-start gap-1.5 mb-1">
              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'rgb(var(--success))' }} />
              {n}
            </div>
          ))}
        </Card>
      )}

      {edgeCases && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
            <h4 className="font-semibold text-default text-sm">Edge Case Suggestions</h4>
          </div>
          <p className="text-xs text-muted mb-3">{edgeCases.summary}</p>
          <div className="space-y-1.5">
            {edgeCases.edgeCases.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant={
                  e.type === 'null' ? 'default' :
                  e.type === 'boundary' ? 'warning' :
                  e.type === 'extreme' ? 'error' :
                  e.type === 'rare_category' ? 'accent' : 'primary'
                }>
                  {e.type}
                </Badge>
                <span className="font-mono text-default">{e.column}</span>
                <span className="text-muted truncate">{e.description}</span>
                <span className="font-mono text-xs" style={{ color: 'rgb(var(--accent))' }}>{e.example}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
