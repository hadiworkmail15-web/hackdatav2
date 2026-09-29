import { type Row } from '@/types/generation';
import { formatValue } from '@/lib/tabular-generator';
import type { ColumnSchema } from '@/types/schema';

interface DataTableProps {
  rows: Row[];
  columns: ColumnSchema[];
  maxRows?: number;
}

export function DataTable({ rows, columns, maxRows = 20 }: DataTableProps) {
  const displayRows = rows.slice(0, maxRows);

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-default">
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">#</th>
            {columns.map((col) => (
              <th key={col.id} className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  {col.name}
                  {col.primaryKey && <span className="text-[10px] px-1 rounded" style={{ backgroundColor: 'rgb(var(--primary-light))', color: 'rgb(var(--primary))' }}>PK</span>}
                  {col.foreignKey && <span className="text-[10px] px-1 rounded" style={{ backgroundColor: 'rgba(45 212 191 / 0.1)', color: 'rgb(var(--accent))' }}>FK</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} className="border-b border-default transition-colors hover:bg-surface-2">
              <td className="px-3 py-2 text-muted text-xs">{i + 1}</td>
              {columns.map((col) => {
                const val = row[col.name];
                const isNull = val === null || val === undefined;
                return (
                  <td key={col.id} className="px-3 py-2 whitespace-nowrap">
                    {isNull ? (
                      <span className="text-muted italic text-xs">null</span>
                    ) : (
                      <span className="text-default">{formatValue(val, col.semanticType)}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
