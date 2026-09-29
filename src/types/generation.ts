import type { GenerationSettings, TableSchema } from './schema';

export type Row = Record<string, string | number | boolean | null>;

export interface GeneratedTable {
  schema: TableSchema;
  rows: Row[];
}

export interface ValidationResult {
  check: string;
  passed: boolean;
  message: string;
  details?: string;
}

export interface GenerationStats {
  rowsGenerated: number;
  tables: number;
  relationships: number;
  nullRate: number;
  outlierRate: number;
  validationStatus: 'passed' | 'failed' | 'pending';
  durationMs: number;
}

export interface GenerationResult {
  tables: GeneratedTable[];
  validation: ValidationResult[];
  stats: GenerationStats;
  settings: GenerationSettings;
}
