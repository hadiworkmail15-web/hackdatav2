// ── Shared Schema Type System ──────────────────────────────────────────────
// This is the common foundation used by the Tabular, Relational, and Document
// generators. Every part of SynthForge reads from these types.

export type DataType =
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'uuid'
  | 'currency'
  | 'text';

export const DATA_TYPES: DataType[] = [
  'string',
  'integer',
  'float',
  'boolean',
  'date',
  'datetime',
  'email',
  'uuid',
  'currency',
  'text',
];

// Semantic types describe the *meaning* of a column for the generator engine.
// They map onto the richer DataType but carry extra generation hints.
export type SemanticType =
  | 'person_name'
  | 'email'
  | 'phone'
  | 'address'
  | 'date'
  | 'age'
  | 'integer'
  | 'decimal'
  | 'currency'
  | 'boolean'
  | 'category'
  | 'uuid'
  | 'text';

export const SEMANTIC_TYPES: SemanticType[] = [
  'person_name',
  'email',
  'phone',
  'address',
  'date',
  'age',
  'integer',
  'decimal',
  'currency',
  'boolean',
  'category',
  'uuid',
  'text',
];

// Maps semantic types to their underlying data type for generation.
export const SEMANTIC_TO_DATA: Record<SemanticType, DataType> = {
  person_name: 'string',
  email: 'email',
  phone: 'string',
  address: 'string',
  date: 'date',
  age: 'integer',
  integer: 'integer',
  decimal: 'float',
  currency: 'currency',
  boolean: 'boolean',
  category: 'string',
  uuid: 'uuid',
  text: 'text',
};

// ── ColumnSchema ────────────────────────────────────────────────────────────

export interface ColumnSchema {
  id: string;
  name: string;
  dataType: DataType;
  semanticType?: string;
  primaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  nullable?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  allowedValues?: string[];
  description?: string;
}

// ── TableSchema ─────────────────────────────────────────────────────────────

export interface TableSchema {
  id: string;
  name: string;
  description?: string;
  columns: ColumnSchema[];
}

// ── Relationship ────────────────────────────────────────────────────────────

export type RelationshipType = '1:1' | '1:N' | 'N:N';

export interface Relationship {
  id: string;
  type: RelationshipType;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

// ── DataSchema (the top-level container) ────────────────────────────────────

export interface DataSchema {
  name: string;
  description?: string;
  tables: TableSchema[];
  relationships: Relationship[];
}

// ── Generation Settings (kept here for shared use) ───────────────────────────

export interface GenerationSettings {
  rowCount: number;
  locale: string;
  currency: string;
  nullRate: number;
  outlierRate: number;
  seed: number;
}

export const DEFAULT_SETTINGS: GenerationSettings = {
  rowCount: 1000,
  locale: 'en-US',
  currency: 'USD',
  nullRate: 5,
  outlierRate: 2,
  seed: 42,
};

// ── Backward-compatibility layer ───────────────────────────────────────────
// The existing generator/validation code uses ColumnDefinition with a few
// differently-named fields. We provide aliases and adapters so the old code
// keeps working without rewriting every file at once.

export interface ColumnDefinition {
  id: string;
  name: string;
  dataType: DataType;
  semanticType: SemanticType;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: { table: string; column: string };
  unique?: boolean;
  categoryValues?: string[];
  minValue?: number;
  maxValue?: number;
  description?: string;
}

export interface RelationalSchema {
  tables: TableSchema[];
  relationships: Array<{
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    type: '1:N';
  }>;
}

// Convert a ColumnSchema (new) → ColumnDefinition (legacy generator format)
export function toColumnDefinition(col: ColumnSchema): ColumnDefinition {
  const semantic = (col.semanticType ?? 'text') as SemanticType;
  return {
    id: col.id,
    name: col.name,
    dataType: col.dataType,
    semanticType: semantic,
    nullable: col.nullable ?? false,
    primaryKey: col.primaryKey ?? false,
    foreignKey: col.foreignKey,
    unique: col.unique,
    categoryValues: col.allowedValues,
    minValue: col.min,
    maxValue: col.max,
    description: col.description,
  };
}

// Convert a TableSchema (new) columns → ColumnDefinition[] (legacy)
export function toColumnDefinitions(table: TableSchema): ColumnDefinition[] {
  return table.columns.map(toColumnDefinition);
}

// Convert a full DataSchema → RelationalSchema (legacy generator format)
export function toRelationalSchema(schema: DataSchema): RelationalSchema {
  return {
    tables: schema.tables,
    relationships: schema.relationships.map((r) => ({
      fromTable: r.fromTable,
      fromColumn: r.fromColumn,
      toTable: r.toTable,
      toColumn: r.toColumn,
      type: '1:N' as const,
    })),
  };
}
