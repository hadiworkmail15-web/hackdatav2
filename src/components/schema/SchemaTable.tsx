import { Plus, Trash2, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ColumnEditor } from './ColumnEditor';
import type { ColumnSchema, TableSchema } from '@/types/schema';

interface SchemaTableProps {
  table: TableSchema;
  allTables: TableSchema[];
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddColumn: () => void;
  onUpdateColumn: (columnId: string, patch: Partial<ColumnSchema>) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function SchemaTable({
  table,
  allTables,
  onRename,
  onDelete,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
}: SchemaTableProps) {
  const tableData = allTables.map((t) => ({ name: t.name, columns: t.columns }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Table2 className="w-4 h-4 text-muted" />
          <input
            value={table.name}
            onChange={(e) => onRename(e.target.value)}
            className="input font-semibold flex-1"
            style={{ maxWidth: '240px' }}
          />
          <span className="text-xs text-muted whitespace-nowrap">{table.columns.length} columns</span>
        </div>
        <Button onClick={onDelete} variant="ghost" size="sm">
          <Trash2 className="w-3.5 h-3.5" />
          Delete Table
        </Button>
      </div>

      {table.description !== undefined && (
        <input
          value={table.description}
          onChange={() => {}}
          className="input text-xs"
          placeholder="Table description (optional)"
          readOnly
        />
      )}

      <div className="space-y-2">
        {table.columns.map((col) => (
          <ColumnEditor
            key={col.id}
            column={col}
            tableName={table.name}
            allTables={tableData}
            onChange={(patch) => onUpdateColumn(col.id, patch)}
            onDelete={() => onDeleteColumn(col.id)}
          />
        ))}
      </div>

      <Button onClick={onAddColumn} variant="secondary" size="sm" className="w-full">
        <Plus className="w-3.5 h-3.5" />
        Add Column
      </Button>
    </div>
  );
}
