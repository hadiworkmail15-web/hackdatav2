import { Table2, Columns3, Link2, Key, Fingerprint, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { DataSchema } from '@/types/schema';
import { countStats } from '@/lib/schema/schemaUtils';

interface SchemaSummaryProps {
  schema: DataSchema;
}

export function SchemaSummary({ schema }: SchemaSummaryProps) {
  const stats = countStats(schema);

  const items = [
    { icon: <Table2 className="w-4 h-4" />, label: 'Tables', value: stats.tables, color: 'rgb(var(--primary))' },
    { icon: <Columns3 className="w-4 h-4" />, label: 'Columns', value: stats.columns, color: 'rgb(var(--accent))' },
    { icon: <Link2 className="w-4 h-4" />, label: 'Relationships', value: stats.relationships, color: 'rgb(var(--accent))' },
    { icon: <Key className="w-4 h-4" />, label: 'Primary Keys', value: stats.primaryKeys, color: 'rgb(var(--primary))' },
    { icon: <Link2 className="w-4 h-4" />, label: 'Foreign Keys', value: stats.foreignKeys, color: 'rgb(var(--accent))' },
    { icon: <HelpCircle className="w-4 h-4" />, label: 'Nullable', value: stats.nullable, color: 'rgb(var(--warning))' },
    { icon: <Fingerprint className="w-4 h-4" />, label: 'Unique', value: stats.unique, color: 'rgb(var(--primary))' },
  ];

  return (
    <Card padding="sm">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="flex items-center justify-center mb-1" style={{ color: item.color }}>
              {item.icon}
            </div>
            <div className="text-lg font-bold text-default">{item.value}</div>
            <div className="text-[10px] text-muted uppercase tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
