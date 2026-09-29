import { Key, Link2, Fingerprint } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { DataSchema } from '@/types/schema';

interface SchemaPreviewProps {
  schema: DataSchema;
}

export function SchemaPreview({ schema }: SchemaPreviewProps) {
  if (schema.tables.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted text-center py-4">No tables to preview.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {schema.tables.map((table) => (
        <Card key={table.id} padding="none">
          <div className="px-4 py-3 border-b border-default">
            <h4 className="font-semibold text-default text-sm uppercase tracking-wide">{table.name}</h4>
            {table.description && <p className="text-xs text-muted mt-0.5">{table.description}</p>}
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">Column</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">Data Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">Semantic</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">Constraints</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col) => (
                  <tr key={col.id} className="border-b border-default hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs text-default">{col.name}</td>
                    <td className="px-4 py-2 text-xs text-muted uppercase">{col.dataType}</td>
                    <td className="px-4 py-2 text-xs text-muted">{col.semanticType ?? '—'}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {col.primaryKey && (
                          <span className="badge text-[10px]" style={{ backgroundColor: 'rgb(var(--primary-light))', color: 'rgb(var(--primary))' }}>
                            <Key className="w-2.5 h-2.5" /> PK
                          </span>
                        )}
                        {col.foreignKey && (
                          <span className="badge text-[10px]" style={{ backgroundColor: 'rgba(45 212 191 / 0.1)', color: 'rgb(var(--accent))' }}>
                            <Link2 className="w-2.5 h-2.5" /> FK→{col.foreignKey.table}
                          </span>
                        )}
                        {col.unique && (
                          <span className="badge text-[10px]" style={{ backgroundColor: 'rgb(var(--primary-light))', color: 'rgb(var(--primary))' }}>
                            <Fingerprint className="w-2.5 h-2.5" /> UNIQUE
                          </span>
                        )}
                        {col.nullable && (
                          <span className="badge text-[10px]" style={{ backgroundColor: 'rgb(var(--warning-light))', color: 'rgb(var(--warning))' }}>
                            NULL
                          </span>
                        )}
                        {col.min !== undefined && col.max !== undefined && (
                          <span className="text-[10px] text-muted">[{col.min}, {col.max}]</span>
                        )}
                        {col.allowedValues && col.allowedValues.length > 0 && (
                          <span className="text-[10px] text-muted truncate max-w-[120px]">
                            {col.allowedValues.join(', ')}
                          </span>
                        )}
                        {!col.primaryKey && !col.foreignKey && !col.unique && !col.nullable && col.min === undefined && !col.allowedValues && (
                          <span className="text-[10px] text-muted/50">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
