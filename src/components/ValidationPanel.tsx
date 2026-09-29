import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import type { ValidationResult } from '@/types/generation';

interface ValidationPanelProps {
  results: ValidationResult[];
}

export function ValidationPanel({ results }: ValidationPanelProps) {
  if (results.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-muted" />}
          title="No validation yet"
          description="Generate data to run validation checks on primary keys, foreign keys, null rates, and more."
        />
      </Card>
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const allPassed = failed === 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" style={{ color: allPassed ? 'rgb(var(--success))' : 'rgb(var(--error))' }} />
          <h4 className="font-semibold text-default text-sm">Validation Results</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge" style={{ backgroundColor: 'rgb(var(--success-light))', color: 'rgb(var(--success))' }}>
            {passed} passed
          </span>
          {failed > 0 && (
            <span className="badge" style={{ backgroundColor: 'rgb(var(--error-light))', color: 'rgb(var(--error))' }}>
              {failed} failed
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            {r.passed ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'rgb(var(--success))' }} />
            ) : (
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'rgb(var(--error))' }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-default">{r.check}</p>
              <p className="text-xs text-muted">{r.message}</p>
              {r.details && <p className="text-xs text-muted/70 mt-0.5">{r.details}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
