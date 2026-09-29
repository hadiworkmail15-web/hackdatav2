import type { DataSchema, ColumnSchema, TableSchema } from '@/types/schema';

let idCounter = 0;

export function genId(prefix: string): string {
  idCounter++;
  return `${prefix}-${idCounter}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

function col(
  name: string,
  dataType: ColumnSchema['dataType'],
  opts: Partial<ColumnSchema> = {},
): ColumnSchema {
  return {
    id: genId('col'),
    name,
    dataType,
    semanticType: opts.semanticType,
    primaryKey: opts.primaryKey,
    foreignKey: opts.foreignKey,
    nullable: opts.nullable,
    unique: opts.unique,
    min: opts.min,
    max: opts.max,
    allowedValues: opts.allowedValues,
    description: opts.description,
  };
}

function table(name: string, columns: ColumnSchema[], description?: string): TableSchema {
  return {
    id: genId('tbl'),
    name,
    description,
    columns,
  };
}

export function createEmptyColumn(): ColumnSchema {
  return {
    id: genId('col'),
    name: 'new_column',
    dataType: 'string',
    semanticType: 'text',
    nullable: true,
    primaryKey: false,
    unique: false,
  };
}

export function createEmptyTable(): TableSchema {
  return {
    id: genId('tbl'),
    name: 'new_table',
    columns: [createEmptyColumn()],
  };
}

export function createEmptySchema(): DataSchema {
  return {
    name: 'Untitled Schema',
    description: '',
    tables: [],
    relationships: [],
  };
}

// ── E-commerce Demo Schema ──────────────────────────────────────────────────

export const ECOMMERCE_DEMO_SCHEMA: DataSchema = {
  name: 'E-commerce Demo',
  description: 'A classic e-commerce schema with customers, orders, and order items.',
  tables: [
    table(
      'customers',
      [
        col('customer_id', 'uuid', { primaryKey: true, semanticType: 'uuid', description: 'Unique customer identifier' }),
        col('name', 'string', { semanticType: 'person_name', description: 'Customer full name' }),
        col('email', 'email', { unique: true, semanticType: 'email', description: 'Customer email address' }),
        col('country', 'string', { semanticType: 'category', allowedValues: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan'] }),
        col('created_at', 'datetime', { semanticType: 'date', description: 'Account creation timestamp' }),
      ],
      'Customer accounts',
    ),
    table(
      'orders',
      [
        col('order_id', 'uuid', { primaryKey: true, semanticType: 'uuid', description: 'Unique order identifier' }),
        col('customer_id', 'uuid', {
          foreignKey: { table: 'customers', column: 'customer_id' },
          semanticType: 'uuid',
          description: 'Reference to customer',
        }),
        col('order_date', 'date', { semanticType: 'date', description: 'Date the order was placed' }),
        col('status', 'string', {
          semanticType: 'category',
          allowedValues: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          description: 'Order fulfillment status',
        }),
        col('total', 'currency', { nullable: true, semanticType: 'currency', description: 'Calculated order total' }),
      ],
      'Customer orders',
    ),
    table(
      'order_items',
      [
        col('item_id', 'uuid', { primaryKey: true, semanticType: 'uuid', description: 'Unique line item identifier' }),
        col('order_id', 'uuid', {
          foreignKey: { table: 'orders', column: 'order_id' },
          semanticType: 'uuid',
          description: 'Reference to order',
        }),
        col('product_name', 'string', { semanticType: 'text', description: 'Product name' }),
        col('quantity', 'integer', { min: 1, max: 20, semanticType: 'integer', description: 'Units ordered' }),
        col('unit_price', 'currency', { semanticType: 'currency', description: 'Price per unit' }),
      ],
      'Order line items',
    ),
  ],
  relationships: [
    {
      id: genId('rel'),
      type: '1:N',
      fromTable: 'customers',
      fromColumn: 'customer_id',
      toTable: 'orders',
      toColumn: 'customer_id',
    },
    {
      id: genId('rel'),
      type: '1:N',
      fromTable: 'orders',
      fromColumn: 'order_id',
      toTable: 'order_items',
      toColumn: 'order_id',
    },
  ],
};

// ── Legacy single-table demo (for tabular mode) ─────────────────────────────

export const DEMO_TABULAR_TABLE: TableSchema = table(
  'users',
  [
    col('id', 'uuid', { primaryKey: true, semanticType: 'uuid' }),
    col('full_name', 'string', { semanticType: 'person_name' }),
    col('email', 'email', { unique: true, semanticType: 'email' }),
    col('phone', 'string', { semanticType: 'phone' }),
    col('address', 'string', { nullable: true, semanticType: 'address' }),
    col('age', 'integer', { nullable: true, min: 0, max: 120, semanticType: 'age' }),
    col('salary', 'currency', { nullable: true, semanticType: 'currency' }),
    col('is_active', 'boolean', { semanticType: 'boolean' }),
    col('account_type', 'string', {
      semanticType: 'category',
      allowedValues: ['free', 'pro', 'enterprise', 'trial'],
    }),
    col('signup_date', 'date', { semanticType: 'date' }),
  ],
  'Demo user table for tabular generation',
);
