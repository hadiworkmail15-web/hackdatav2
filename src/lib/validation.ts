import type { GeneratedTable, ValidationResult, Row } from '@/types/generation';
import type { GenerationSettings, ColumnSchema, SemanticType } from '@/types/schema';

export function validateTables(
  tables: GeneratedTable[],
  settings: GenerationSettings,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const table of tables) {
    const pkColumns = table.schema.columns.filter((c) => c.primaryKey);

    // 1. Primary key uniqueness
    for (const pk of pkColumns) {
      const values = table.rows.map((r) => r[pk.name]).filter((v) => v !== null);
      const unique = new Set(values);
      const isUnique = values.length === unique.size;
      results.push({
        check: `Primary key "${pk.name}" uniqueness (${table.schema.name})`,
        passed: isUnique,
        message: isUnique
          ? `${values.length} unique values`
          : `${values.length - unique.size} duplicates found`,
      });
    }

    // 1b. Unique field uniqueness (non-PK unique columns)
    const uniqueNonPk = table.schema.columns.filter((c) => c.unique && !c.primaryKey);
    for (const col of uniqueNonPk) {
      const values = table.rows.map((r) => r[col.name]).filter((v) => v !== null);
      const unique = new Set(values);
      const isUnique = values.length === unique.size;
      results.push({
        check: `Unique field "${col.name}" uniqueness (${table.schema.name})`,
        passed: isUnique,
        message: isUnique
          ? `${values.length} unique values`
          : `${values.length - unique.size} duplicates found`,
      });
    }

    // 2. Foreign key integrity
    const fkColumns = table.schema.columns.filter((c) => c.foreignKey);
    for (const fk of fkColumns) {
      const refTable = tables.find((t) => t.schema.name === fk.foreignKey!.table);
      if (!refTable) {
        results.push({
          check: `Foreign key "${fk.name}" → ${fk.foreignKey!.table}.${fk.foreignKey!.column}`,
          passed: false,
          message: 'Referenced table not found',
        });
        continue;
      }
      const refValues = new Set(
        refTable.rows.map((r) => r[fk.foreignKey!.column]).filter((v) => v !== null),
      );
      const fkValues = table.rows.map((r) => r[fk.name]).filter((v) => v !== null);
      const allValid = fkValues.every((v) => refValues.has(v));
      results.push({
        check: `Foreign key "${fk.name}" → ${fk.foreignKey!.table}.${fk.foreignKey!.column}`,
        passed: allValid,
        message: allValid
          ? `${fkValues.length} references valid`
          : 'Some references are invalid',
      });
    }

    // 3. Required fields (non-nullable, non-PK)
    const requiredCols = table.schema.columns.filter((c) => !c.nullable && !c.primaryKey);
    for (const col of requiredCols) {
      const nullCount = table.rows.filter((r) => r[col.name] === null).length;
      results.push({
        check: `Required field "${col.name}" (${table.schema.name})`,
        passed: nullCount === 0,
        message: nullCount === 0 ? 'No nulls in required field' : `${nullCount} nulls found`,
      });
    }

    // 4. Null rate
    const nullableCols = table.schema.columns.filter((c) => c.nullable);
    for (const col of nullableCols) {
      const nullCount = table.rows.filter((r) => r[col.name] === null).length;
      const actualRate = (nullCount / table.rows.length) * 100;
      const withinTarget = Math.abs(actualRate - settings.nullRate) < settings.nullRate * 2 + 2;
      results.push({
        check: `Null rate "${col.name}" (${table.schema.name})`,
        passed: withinTarget,
        message: `Actual: ${actualRate.toFixed(1)}% (target: ${settings.nullRate}%)`,
        details: `${nullCount}/${table.rows.length} nulls`,
      });
    }
  }

  // 5. Order total reconciliation (if orders + order_items present)
  const ordersTable = tables.find((t) => t.schema.name === 'orders');
  const itemsTable = tables.find((t) => t.schema.name === 'order_items');
  if (ordersTable && itemsTable) {
    let reconciled = true;
    let mismatchCount = 0;
    for (const order of ordersTable.rows) {
      const orderId = order.order_id;
      const items = itemsTable.rows.filter((r) => r.order_id === orderId);
      const calculatedTotal = Math.round(
        items.reduce((sum, item) => sum + (item.quantity as number) * (item.unit_price as number), 0) * 100,
      ) / 100;
      const storedTotal = Math.round((order.total as number) * 100) / 100;
      if (calculatedTotal !== storedTotal) {
        reconciled = false;
        mismatchCount++;
      }
    }
    results.push({
      check: 'Order total reconciliation',
      passed: reconciled,
      message: reconciled
        ? `${ordersTable.rows.length} orders reconciled`
        : `${mismatchCount} mismatches found`,
    });
  }

  // 6. Numeric ranges
  for (const table of tables) {
    const numericCols = table.schema.columns.filter((c) => {
      const sem = (c.semanticType ?? '') as SemanticType;
      return sem === 'age' || sem === 'integer' || sem === 'decimal';
    });
    for (const col of numericCols) {
      const values = table.rows.map((r) => r[col.name]).filter((v): v is number => typeof v === 'number');
      if (values.length === 0) continue;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const rangeOk = col.min !== undefined && col.max !== undefined
        ? min >= col.min && max <= col.max
        : true;
      results.push({
        check: `Numeric range "${col.name}" (${table.schema.name})`,
        passed: rangeOk,
        message: `Range: ${min} – ${max}`,
      });
    }
  }

  return results;
}

export function summarizeValidation(results: ValidationResult[]): 'passed' | 'failed' {
  return results.every((r) => r.passed) ? 'passed' : 'failed';
}
