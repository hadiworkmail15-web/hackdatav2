import type {
  DataSchema,
  TableSchema,
  ColumnSchema,
  Relationship,
  RelationshipType,
} from '@/types/schema';
import { genId, createEmptyColumn, createEmptyTable } from './demoSchema';

// ── Factory helpers ──────────────────────────────────────────────────────────

export function addTable(schema: DataSchema): DataSchema {
  return {
    ...schema,
    tables: [...schema.tables, createEmptyTable()],
  };
}

export function removeTable(schema: DataSchema, tableId: string): DataSchema {
  const removed = schema.tables.find((t) => t.id === tableId);
  const tableName = removed?.name;
  return {
    ...schema,
    tables: schema.tables.filter((t) => t.id !== tableId),
    relationships: tableName
      ? schema.relationships.filter(
          (r) => r.fromTable !== tableName && r.toTable !== tableName,
        )
      : schema.relationships,
  };
}

export function renameTable(schema: DataSchema, tableId: string, name: string): DataSchema {
  const oldTable = schema.tables.find((t) => t.id === tableId);
  const oldName = oldTable?.name;
  const newTables = schema.tables.map((t) =>
    t.id === tableId ? { ...t, name } : t,
  );
  // Update FK references that point to the old table name
  const newTablesFixed = newTables.map((t) => ({
    ...t,
    columns: t.columns.map((c) => {
      if (c.foreignKey && c.foreignKey.table === oldName) {
        return { ...c, foreignKey: { table: name, column: c.foreignKey.column } };
      }
      return c;
    }),
  }));
  // Update relationships
  const newRels = schema.relationships.map((r) => ({
    ...r,
    fromTable: r.fromTable === oldName ? name : r.fromTable,
    toTable: r.toTable === oldName ? name : r.toTable,
  }));
  return { ...schema, tables: newTablesFixed, relationships: newRels };
}

export function addColumn(schema: DataSchema, tableId: string): DataSchema {
  return {
    ...schema,
    tables: schema.tables.map((t) =>
      t.id === tableId ? { ...t, columns: [...t.columns, createEmptyColumn()] } : t,
    ),
  };
}

export function updateColumn(
  schema: DataSchema,
  tableId: string,
  columnId: string,
  patch: Partial<ColumnSchema>,
): DataSchema {
  return {
    ...schema,
    tables: schema.tables.map((t) =>
      t.id === tableId
        ? {
            ...t,
            columns: t.columns.map((c) =>
              c.id === columnId ? { ...c, ...patch } : c,
            ),
          }
        : t,
    ),
  };
}

export function removeColumn(schema: DataSchema, tableId: string, columnId: string): DataSchema {
  const table = schema.tables.find((t) => t.id === tableId);
  const removedCol = table?.columns.find((c) => c.id === columnId);
  const removedName = removedCol?.name;
  return {
    ...schema,
    tables: schema.tables.map((t) =>
      t.id === tableId
        ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) }
        : t,
    ),
    relationships: removedName
      ? schema.relationships.filter(
          (r) =>
            !(
              (r.fromTable === table?.name && r.fromColumn === removedName) ||
              (r.toTable === table?.name && r.toColumn === removedName)
            ),
        )
      : schema.relationships,
  };
}

// ── Relationship helpers ──────────────────────────────────────────────────────

export function addRelationship(
  schema: DataSchema,
  rel: Omit<Relationship, 'id'>,
): DataSchema {
  return {
    ...schema,
    relationships: [...schema.relationships, { ...rel, id: genId('rel') }],
  };
}

export function removeRelationship(schema: DataSchema, relId: string): DataSchema {
  return {
    ...schema,
    relationships: schema.relationships.filter((r) => r.id !== relId),
  };
}

// ── Auto-derive relationships from foreign keys ──────────────────────────────

export function deriveRelationships(schema: DataSchema): Relationship[] {
  const rels: Relationship[] = [];
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.foreignKey) {
        const exists = rels.some(
          (r) =>
            r.fromTable === table.name &&
            r.fromColumn === col.name &&
            r.toTable === col.foreignKey!.table &&
            r.toColumn === col.foreignKey!.column,
        );
        if (!exists) {
          rels.push({
            id: genId('rel'),
            type: '1:N',
            fromTable: table.name,
            fromColumn: col.name,
            toTable: col.foreignKey.table,
            toColumn: col.foreignKey.column,
          });
        }
      }
    }
  }
  return rels;
}

// ── Query helpers ────────────────────────────────────────────────────────────

export function getTableByName(schema: DataSchema, name: string): TableSchema | undefined {
  return schema.tables.find((t) => t.name === name);
}

export function getColumnNames(schema: DataSchema, tableName: string): string[] {
  return getTableByName(schema, tableName)?.columns.map((c) => c.name) ?? [];
}

export function getForeignKeyColumns(schema: DataSchema): Array<{
  table: string;
  column: ColumnSchema;
}> {
  const result: Array<{ table: string; column: ColumnSchema }> = [];
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.foreignKey) result.push({ table: table.name, column: col });
    }
  }
  return result;
}

export function getPrimaryKeyColumns(table: TableSchema): ColumnSchema[] {
  return table.columns.filter((c) => c.primaryKey);
}

export function countStats(schema: DataSchema) {
  const totalColumns = schema.tables.reduce((s, t) => s + t.columns.length, 0);
  const pkCount = schema.tables.reduce(
    (s, t) => s + t.columns.filter((c) => c.primaryKey).length,
    0,
  );
  const fkCount = schema.tables.reduce(
    (s, t) => s + t.columns.filter((c) => c.foreignKey).length,
    0,
  );
  const nullableCount = schema.tables.reduce(
    (s, t) => s + t.columns.filter((c) => c.nullable).length,
    0,
  );
  const uniqueCount = schema.tables.reduce(
    (s, t) => s + t.columns.filter((c) => c.unique).length,
    0,
  );
  return {
    tables: schema.tables.length,
    columns: totalColumns,
    relationships: schema.relationships.length,
    primaryKeys: pkCount,
    foreignKeys: fkCount,
    nullable: nullableCount,
    unique: uniqueCount,
  };
}

export const RELATIONSHIP_TYPES: RelationshipType[] = ['1:1', '1:N', 'N:N'];
