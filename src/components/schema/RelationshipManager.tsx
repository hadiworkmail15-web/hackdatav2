import { Plus, Trash2, ArrowRight, Network } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import type { DataSchema, Relationship, RelationshipType } from '@/types/schema';
import { RELATIONSHIP_TYPES, getColumnNames } from '@/lib/schema/schemaUtils';

interface RelationshipManagerProps {
  schema: DataSchema;
  onAdd: (rel: Omit<Relationship, 'id'>) => void;
  onRemove: (relId: string) => void;
}

export function RelationshipManager({ schema, onAdd, onRemove }: RelationshipManagerProps) {
  const tableNames = schema.tables.map((t) => t.name);

  const handleAdd = () => {
    if (tableNames.length < 2) return;
    onAdd({
      type: '1:N',
      fromTable: tableNames[0],
      fromColumn: getColumnNames(schema, tableNames[0])[0] ?? '',
      toTable: tableNames[1],
      toColumn: getColumnNames(schema, tableNames[1])[0] ?? '',
    });
  };

  if (schema.tables.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Network className="w-8 h-8 text-muted" />}
          title="No tables yet"
          description="Add at least two tables before defining relationships."
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4" style={{ color: 'rgb(var(--accent))' }} />
          <h4 className="font-semibold text-default text-sm">Relationships</h4>
          <span className="text-xs text-muted">({schema.relationships.length})</span>
        </div>
        <Button onClick={handleAdd} variant="secondary" size="sm" disabled={tableNames.length < 2}>
          <Plus className="w-3.5 h-3.5" />
          Add Relationship
        </Button>
      </div>

      {schema.relationships.length === 0 ? (
        <p className="text-xs text-muted py-4 text-center">
          No relationships defined. Foreign keys on columns also create relationships automatically.
        </p>
      ) : (
        <div className="space-y-2">
          {schema.relationships.map((rel) => (
            <div key={rel.id} className="card p-3 animate-fade-in">
              <div className="flex items-center gap-2 flex-wrap">
                {/* From table.column */}
                <div className="flex flex-col gap-1">
                  <select
                    value={rel.fromTable}
                    onChange={(e) => onAdd({ type: rel.type, fromTable: e.target.value, fromColumn: getColumnNames(schema, e.target.value)[0] ?? '', toTable: rel.toTable, toColumn: rel.toColumn })}
                    className="input text-xs"
                  >
                    {tableNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <select
                    value={rel.fromColumn}
                    onChange={(e) => onAdd({ type: rel.type, fromTable: rel.fromTable, fromColumn: e.target.value, toTable: rel.toTable, toColumn: rel.toColumn })}
                    className="input text-xs"
                  >
                    {getColumnNames(schema, rel.fromTable).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Type + arrow */}
                <div className="flex flex-col items-center px-2">
                  <select
                    value={rel.type}
                    onChange={(e) => onAdd({ type: e.target.value as RelationshipType, fromTable: rel.fromTable, fromColumn: rel.fromColumn, toTable: rel.toTable, toColumn: rel.toColumn })}
                    className="input text-xs text-center font-bold"
                    style={{ width: '60px' }}
                  >
                    {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ArrowRight className="w-5 h-5 mt-1" style={{ color: 'rgb(var(--accent))' }} />
                </div>

                {/* To table.column */}
                <div className="flex flex-col gap-1">
                  <select
                    value={rel.toTable}
                    onChange={(e) => onAdd({ type: rel.type, fromTable: rel.fromTable, fromColumn: rel.fromColumn, toTable: e.target.value, toColumn: getColumnNames(schema, e.target.value)[0] ?? '' })}
                    className="input text-xs"
                  >
                    {tableNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <select
                    value={rel.toColumn}
                    onChange={(e) => onAdd({ type: rel.type, fromTable: rel.fromTable, fromColumn: rel.fromColumn, toTable: rel.toTable, toColumn: e.target.value })}
                    className="input text-xs"
                  >
                    {getColumnNames(schema, rel.toTable).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => onRemove(rel.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-red-500 transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
