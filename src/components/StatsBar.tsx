import { BarChart3, Table2, Link2, Percent, TrendingUp, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { GenerationStats } from '@/types/generation';

interface StatsBarProps {
  stats: GenerationStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { icon: <BarChart3 className="w-4 h-4" />, label: 'Rows Generated', value: stats.rowsGenerated.toLocaleString() },
    { icon: <Table2 className="w-4 h-4" />, label: 'Tables', value: stats.tables },
    { icon: <Link2 className="w-4 h-4" />, label: 'Relationships', value: stats.relationships },
    { icon: <Percent className="w-4 h-4" />, label: 'Null Rate', value: `${stats.nullRate}%` },
    { icon: <TrendingUp className="w-4 h-4" />, label: 'Outlier Rate', value: `${stats.outlierRate}%` },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: 'Validation',
      value: stats.validationStatus === 'passed' ? 'Passed' : stats.validationStatus === 'failed' ? 'Failed' : 'Pending',
      color: stats.validationStatus === 'passed' ? 'rgb(var(--success))' : stats.validationStatus === 'failed' ? 'rgb(var(--error))' : 'rgb(var(--text-muted))',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <Card key={item.label} padding="sm">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: (item as { color?: string }).color ?? 'rgb(var(--primary))' }}>{item.icon}</span>
            <span className="text-xs text-muted">{item.label}</span>
          </div>
          <div className="text-lg font-bold text-default">{item.value}</div>
        </Card>
      ))}
    </div>
  );
}
