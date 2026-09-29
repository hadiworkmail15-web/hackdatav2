// Re-export from the new schema system for backward compatibility.
// Existing code that imports from '@/lib/demo-schema' will continue to work.

export {
  ECOMMERCE_DEMO_SCHEMA as ECOMMERCE_RELATIONAL_SCHEMA,
  DEMO_TABULAR_TABLE as DEMO_TABULAR_SCHEMA,
  resetIdCounter,
  genId,
  createEmptyColumn,
  createEmptyTable,
  createEmptySchema,
} from '@/lib/schema/demoSchema';

// The legacy code expects ECOMMERCE_RELATIONAL_SCHEMA to be a RelationalSchema
// (with fromTable/toTable relationships), but ECOMMERCE_DEMO_SCHEMA is a DataSchema.
// We provide a converted version for the relational generator.
import { ECOMMERCE_DEMO_SCHEMA, DEMO_TABULAR_TABLE } from '@/lib/schema/demoSchema';
import { toRelationalSchema, toColumnDefinitions, type RelationalSchema, type TableSchema, type ColumnDefinition } from '@/types/schema';

export const ECOMMERCE_RELATIONAL_LEGACY: RelationalSchema = toRelationalSchema(ECOMMERCE_DEMO_SCHEMA);

export const DEMO_TABULAR_LEGACY: TableSchema = {
  id: DEMO_TABULAR_TABLE.id,
  name: DEMO_TABULAR_TABLE.name,
  columns: toColumnDefinitions(DEMO_TABULAR_TABLE),
};

// Legacy createEmptyColumn returns ColumnDefinition format
export function createEmptyColumnLegacy(): ColumnDefinition {
  return {
    id: `col-${Date.now()}`,
    name: 'new_column',
    dataType: 'string',
    semanticType: 'text',
    nullable: true,
    primaryKey: false,
  };
}
