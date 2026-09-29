import { Plus, Sparkles, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { SchemaTable } from './SchemaTable';
import { RelationshipManager } from './RelationshipManager';
import { SchemaSummary } from './SchemaSummary';
import { SchemaPreview } from './SchemaPreview';
import type { DataSchema, ColumnSchema } from '@/types/schema';
import {
  addTable,
  removeTable,
  renameTable,
  addColumn,
  updateColumn,
  removeColumn,
  addRelationship,
  removeRelationship,
  deriveRelationships,
} from '@/lib/schema/schemaUtils';
import { validateSchema, summarizeIssues } from '@/lib/schema/schemaValidation';

interface SchemaBuilderProps {
  schema: DataSchema;
  onChange: (schema: DataSchema) => void;
  onAnalyze?: () => void;
  analyzing?: boolean;
}

export function SchemaBuilder({ schema, onChange, onAnalyze, analyzing }: SchemaBuilderProps) {
  const issues = validateSchema(schema);
  const { errors, warnings } = summarizeIssues(issues);

  const handleAddTable = () => onChange(addTable(schema));
  const handleRemoveTable = (tableId: string) => onChange(removeTable(schema, tableId));
  const handleRenameTable = (tableId: string, name: string) => onChange(renameTable(schema, tableId, name));
  const handleAddColumn = (tableId: string) => onChange(addColumn(schema, tableId));
  const handleUpdateColumn = (tableId: string, columnId: string, patch: Partial<ColumnSchema>) =>
    onChange(updateColumn(schema, tableId, columnId, patch));
  const handleRemoveColumn = (tableId: string, columnId: string) =>
    onChange(removeColumn(schema, tableId, columnId));

  const handleAddRel = (rel: Parameters<typeof addRelationship>[1]) => {
    onChange(addRelationship(schema, rel));
  };
  const handleRemoveRel = (relId: string) => onChange(removeRelationship(schema, relId));

  const handleAutoDerive = () => {
    const derived = deriveRelationships(schema);
    onChange({ ...schema, relationships: derived });
  };

  return (
    <div className="space-y-5">
      {/* Schema name */}
      <Card>
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5" style={{ color: 'rgb(var(--primary))' }} />
          <div className="flex-1">
            <input
              value={schema.name}
              onChange={(e) => onChange({ ...schema, name: e.target.value })}
              className="input font-semibold"
              placeholder="Schema name"
            />
          </div>
          {onAnalyze && (
            <Button onClick={onAnalyze} variant="secondary" size="sm" loading={analyzing}>
              {!analyzing && <Sparkles className="w-3.5 h-3.5" />}
              Analyze Schema with AI
            </Button>
          )}
        </div>
        {schema.description && (
          <p className="text-xs text-muted mt-2">{schema.description}</p>
        )}
      </Card>

      {/* Summary */}
      <SchemaSummary schema={schema} />

      {/* Validation issues */}
      {(errors > 0 || warnings > 0) && (
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            {errors > 0 ? (
              <AlertCircle className="w-4 h-4" style={{ color: 'rgb(var(--error))' }} />
            ) : (
              <CheckCircle2 className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
            )}
            <span className="text-sm font-semibold text-default">
              {errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : `${warnings} warning${warnings > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="space-y-1">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span
                  className="shrink-0 mt-0.5"
                  style={{ color: issue.level === 'error' ? 'rgb(var(--error))' : 'rgb(var(--warning))' }}
                >
                  {issue.level === 'error' ? '!' : '?'}
                </span>
                <span className="text-muted">
                  {issue.table && <span className="font-mono text-default">{issue.table}.</span>}
                  {issue.column && <span className="font-mono text-default">{issue.column}: </span>}
                  {issue.message}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tables */}
      {schema.tables.map((table) => (
        <Card key={table.id}>
          <CardHeader
            title={table.name}
            subtitle={`${table.columns.length} columns`}
            icon={<Database className="w-5 h-5" style={{ color: 'rgb(var(--primary))' }} />}
          />
          <SchemaTable
            table={table}
            allTables={schema.tables}
            onRename={(name) => handleRenameTable(table.id, name)}
            onDelete={() => handleRemoveTable(table.id)}
            onAddColumn={() => handleAddColumn(table.id)}
            onUpdateColumn={(colId, patch) => handleUpdateColumn(table.id, colId, patch)}
            onDeleteColumn={(colId) => handleRemoveColumn(table.id, colId)}
          />
        </Card>
      ))}

      {/* Add table */}
      <Button onClick={handleAddTable} variant="secondary" size="md" className="w-full">
        <Plus className="w-4 h-4" />
        Add Table
      </Button>

      {/* Relationships */}
      <RelationshipManager schema={schema} onAdd={handleAddRel} onRemove={handleRemoveRel} />

      {/* Auto-derive button */}
      {schema.tables.length > 0 && (
        <Button onClick={handleAutoDerive} variant="ghost" size="sm" className="w-full">
          <Sparkles className="w-3.5 h-3.5" />
          Auto-derive relationships from foreign keys
        </Button>
      )}

      {/* Preview */}
      {schema.tables.length > 0 && (
        <div>
          <h4 className="font-semibold text-default text-sm mb-3">Schema Preview</h4>
          <SchemaPreview schema={schema} />
        </div>
      )}
    </div>
  );
}
