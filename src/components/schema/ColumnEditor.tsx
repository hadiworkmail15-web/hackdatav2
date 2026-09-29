import { Key, Link2, Fingerprint, Trash2 } from 'lucide-react';
import type { ColumnSchema, DataType, SemanticType } from '@/types/schema';
import { DATA_TYPES, SEMANTIC_TYPES, SEMANTIC_TO_DATA } from '@/types/schema';

interface ColumnEditorProps {
  column: ColumnSchema;
  tableName: string;
  allTables: Array<{ name: string; columns: ColumnSchema[] }>;
  onChange: (patch: Partial<ColumnSchema>) => void;
  onDelete: () => void;
}

const NUMERIC_SEMANTICS = ['integer', 'decimal', 'age'];
const CATEGORY_SEMANTICS = ['category'];

export function ColumnEditor({ column, tableName, allTables, onChange, onDelete }: ColumnEditorProps) {
  const isNumeric = NUMERIC_SEMANTICS.includes(column.semanticType ?? '');
  const isCategory = CATEGORY_SEMANTICS.includes(column.semanticType ?? '');

  // Tables other than the current one (for FK targets)
  const fkTargetTables = allTables.filter((t) => t.name !== tableName);

  return (
    <div className="card p-3 animate-fade-in">
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Name */}
        <input
          value={column.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="input col-span-3 font-mono text-xs"
          placeholder="column_name"
        />

        {/* Data type */}
        <select
          value={column.dataType}
          onChange={(e) => onChange({ dataType: e.target.value as DataType })}
          className="input col-span-2 text-xs"
        >
          {DATA_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Semantic type */}
        <select
          value={column.semanticType ?? ''}
          onChange={(e) => {
            const sem = e.target.value as SemanticType;
            onChange({ semanticType: sem, dataType: SEMANTIC_TO_DATA[sem] ?? column.dataType });
          }}
          className="input col-span-2 text-xs"
        >
          <option value="">none</option>
          {SEMANTIC_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Toggles */}
        <div className="col-span-4 flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={column.nullable ?? false}
              onChange={(e) => onChange({ nullable: e.target.checked })}
              className="w-3.5 h-3.5 rounded accent-sky-500"
            />
            <span className="text-xs text-muted">nullable</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={column.primaryKey ?? false}
              onChange={(e) => onChange({ primaryKey: e.target.checked })}
              className="w-3.5 h-3.5 rounded accent-sky-500"
            />
            <Key className="w-3 h-3" style={{ color: column.primaryKey ? 'rgb(var(--primary))' : 'rgb(var(--text-muted))' }} />
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={column.unique ?? false}
              onChange={(e) => onChange({ unique: e.target.checked })}
              className="w-3.5 h-3.5 rounded accent-sky-500"
            />
            <Fingerprint className="w-3 h-3" style={{ color: column.unique ? 'rgb(var(--primary))' : 'rgb(var(--text-muted))' }} />
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!column.foreignKey}
              onChange={(e) => {
                if (e.target.checked && fkTargetTables.length > 0) {
                  const firstTable = fkTargetTables[0];
                  const firstCol = firstTable.columns.find((c) => c.primaryKey) ?? firstTable.columns[0];
                  onChange({ foreignKey: { table: firstTable.name, column: firstCol.name } });
                } else {
                  onChange({ foreignKey: undefined });
                }
              }}
              className="w-3.5 h-3.5 rounded accent-sky-500"
            />
            <Link2 className="w-3 h-3" style={{ color: column.foreignKey ? 'rgb(var(--accent))' : 'rgb(var(--text-muted))' }} />
          </label>
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="col-span-1 p-1.5 rounded-lg text-muted hover:text-red-500 transition-colors flex justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* FK target selectors */}
      {column.foreignKey && fkTargetTables.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <select
            value={column.foreignKey.table}
            onChange={(e) => {
              const t = allTables.find((tt) => tt.name === e.target.value);
              const pk = t?.columns.find((c) => c.primaryKey);
              onChange({ foreignKey: { table: e.target.value, column: pk?.name ?? t?.columns[0]?.name ?? '' } });
            }}
            className="input text-xs"
          >
            {fkTargetTables.map((t) => (
              <option key={t.name} value={t.name}>→ {t.name}</option>
            ))}
          </select>
          <select
            value={column.foreignKey.column}
            onChange={(e) => onChange({ foreignKey: { ...column.foreignKey!, column: e.target.value } })}
            className="input text-xs"
          >
            {(allTables.find((t) => t.name === column.foreignKey!.table)?.columns ?? []).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Allowed values for categorical */}
      {isCategory && (
        <input
          value={column.allowedValues?.join(', ') ?? ''}
          onChange={(e) => onChange({ allowedValues: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          className="input mt-2 text-xs"
          placeholder="allowed values (comma-separated)"
        />
      )}

      {/* Min/Max for numeric */}
      {isNumeric && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input
            type="number"
            value={column.min ?? ''}
            onChange={(e) => onChange({ min: e.target.value ? Number(e.target.value) : undefined })}
            className="input text-xs"
            placeholder="min value"
          />
          <input
            type="number"
            value={column.max ?? ''}
            onChange={(e) => onChange({ max: e.target.value ? Number(e.target.value) : undefined })}
            className="input text-xs"
            placeholder="max value"
          />
        </div>
      )}

      {/* Description */}
      <input
        value={column.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value })}
        className="input mt-2 text-xs"
        placeholder="description (optional)"
      />
    </div>
  );
}
