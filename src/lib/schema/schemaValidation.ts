import type { DataSchema } from '@/types/schema';

export interface SchemaIssue {
  level: 'error' | 'warning';
  table?: string;
  column?: string;
  message: string;
}

export function validateSchema(schema: DataSchema): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const tableNames = new Set<string>();

  // Schema-level
  if (!schema.name.trim()) {
    issues.push({ level: 'error', message: 'Schema must have a name.' });
  }

  for (const table of schema.tables) {
    // Table name required
    if (!table.name.trim()) {
      issues.push({ level: 'error', message: 'Every table must have a name.' });
    }

    // Duplicate table names
    if (tableNames.has(table.name)) {
      issues.push({ level: 'error', table: table.name, message: `Duplicate table name "${table.name}".` });
    }
    tableNames.add(table.name);

    const colNames = new Set<string>();
    for (const col of table.columns) {
      // Column name required
      if (!col.name.trim()) {
        issues.push({ level: 'error', table: table.name, message: 'Every column must have a name.' });
      }

      // Duplicate column names within a table
      if (colNames.has(col.name)) {
        issues.push({ level: 'error', table: table.name, column: col.name, message: `Duplicate column name "${col.name}" in table "${table.name}".` });
      }
      colNames.add(col.name);

      // Numeric min > max
      if (col.min !== undefined && col.max !== undefined && col.min > col.max) {
        issues.push({ level: 'error', table: table.name, column: col.name, message: `Min value (${col.min}) cannot be greater than max value (${col.max}) for column "${col.name}".` });
      }
    }

    // Primary key must reference an existing column (implicit — PK flag is on the column itself)
    const pkCount = table.columns.filter((c) => c.primaryKey).length;
    if (pkCount > 1) {
      issues.push({ level: 'warning', table: table.name, message: `Table "${table.name}" has ${pkCount} primary keys. Composite keys are allowed but may need special handling.` });
    }
  }

  // Foreign key validation
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.foreignKey) {
        const refTable = schema.tables.find((t) => t.name === col.foreignKey!.table);
        if (!refTable) {
          issues.push({
            level: 'error',
            table: table.name,
            column: col.name,
            message: `Foreign key on "${col.name}" references table "${col.foreignKey.table}" which does not exist.`,
          });
        } else {
          const refCol = refTable.columns.find((c) => c.name === col.foreignKey!.column);
          if (!refCol) {
            issues.push({
              level: 'error',
              table: table.name,
              column: col.name,
              message: `Foreign key on "${col.name}" references column "${col.foreignKey.column}" in table "${col.foreignKey.table}" which does not exist.`,
            });
          } else if (!refCol.primaryKey && !refCol.unique) {
            issues.push({
              level: 'warning',
              table: table.name,
              column: col.name,
              message: `Foreign key on "${col.name}" references "${col.foreignKey.table}.${col.foreignKey.column}" which is not a primary key or unique column.`,
            });
          }
        }
      }
    }
  }

  // Relationship endpoint validation
  for (const rel of schema.relationships) {
    const fromTable = schema.tables.find((t) => t.name === rel.fromTable);
    const toTable = schema.tables.find((t) => t.name === rel.toTable);
    if (!fromTable) {
      issues.push({ level: 'error', message: `Relationship references non-existent table "${rel.fromTable}".` });
    } else {
      const fromCol = fromTable.columns.find((c) => c.name === rel.fromColumn);
      if (!fromCol) {
        issues.push({ level: 'error', message: `Relationship references non-existent column "${rel.fromTable}.${rel.fromColumn}".` });
      }
    }
    if (!toTable) {
      issues.push({ level: 'error', message: `Relationship references non-existent table "${rel.toTable}".` });
    } else {
      const toCol = toTable.columns.find((c) => c.name === rel.toColumn);
      if (!toCol) {
        issues.push({ level: 'error', message: `Relationship references non-existent column "${rel.toTable}.${rel.toColumn}".` });
      }
    }
  }

  return issues;
}

export function hasErrors(issues: SchemaIssue[]): boolean {
  return issues.some((i) => i.level === 'error');
}

export function summarizeIssues(issues: SchemaIssue[]): { errors: number; warnings: number } {
  return {
    errors: issues.filter((i) => i.level === 'error').length,
    warnings: issues.filter((i) => i.level === 'warning').length,
  };
}
