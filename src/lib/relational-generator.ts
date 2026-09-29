import { SeededRNG } from './rng';
import {
  FIRST_NAMES,
  LAST_NAMES,
  COUNTRIES,
  PRODUCT_NAMES,
  ORDER_STATUSES,
} from './data-pools';
import type { GenerationSettings, DataSchema, TableSchema, ColumnSchema } from '@/types/schema';
import { toRelationalSchema, toColumnDefinitions } from '@/types/schema';
import type { GeneratedTable, Row } from '@/types/generation';
import { generateRows } from './tabular-generator';

function generateUUID(rng: SeededRNG): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) uuid += '-';
    if (i === 12) uuid += '4';
    else if (i === 16) uuid += hex[8 + Math.floor(rng.next() * 4)];
    else uuid += hex[Math.floor(rng.next() * 16)];
  }
  return uuid;
}

function generateDate(rng: SeededRNG, minYear = 2019, maxYear = 2025): string {
  const year = rng.int(minYear, maxYear);
  const month = rng.int(1, 12);
  const day = rng.int(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function generateRelationalData(
  schema: DataSchema | ReturnType<typeof toRelationalSchema>,
  settings: GenerationSettings,
): GeneratedTable[] {
  const rng = new SeededRNG(settings.seed);
  const tables: GeneratedTable[] = [];

  const customerCount = Math.max(10, Math.floor(settings.rowCount * 0.15));
  const orderCount = Math.max(20, Math.floor(settings.rowCount * 0.5));
  const itemCount = settings.rowCount;

  // Generate Customers
  const customers: Row[] = [];
  for (let i = 0; i < customerCount; i++) {
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    customers.push({
      customer_id: generateUUID(rng),
      name,
      email: generateEmail(name, rng),
      country: rng.pick(COUNTRIES),
      created_at: generateDate(rng, 2018, 2024),
    });
  }

  // Generate Orders
  const orders: Row[] = [];
  for (let i = 0; i < orderCount; i++) {
    const customer = rng.pick(customers);
    const orderDate = generateDate(rng, 2020, 2025);
    orders.push({
      order_id: generateUUID(rng),
      customer_id: customer.customer_id,
      order_date: orderDate,
      status: rng.pick(ORDER_STATUSES),
      total: 0,
    });
  }

  // Generate Order Items and calculate totals
  const orderItems: Row[] = [];
  const orderTotals = new Map<string, number>();

  for (const order of orders) {
    const numItems = rng.int(1, 5);
    for (let j = 0; j < numItems; j++) {
      const quantity = rng.int(1, 10);
      const unitPrice = Math.round(rng.float(5, 500) * 100) / 100;
      const subtotal = Math.round(quantity * unitPrice * 100) / 100;

      orderItems.push({
        item_id: generateUUID(rng),
        order_id: order.order_id,
        product_name: rng.pick(PRODUCT_NAMES),
        quantity,
        unit_price: unitPrice,
      });

      const current = orderTotals.get(order.order_id as string) ?? 0;
      orderTotals.set(order.order_id as string, Math.round((current + subtotal) * 100) / 100);
    }
  }

  const finalItems = orderItems.slice(0, itemCount);

  // Set order totals
  for (const order of orders) {
    order.total = orderTotals.get(order.order_id as string) ?? 0;
  }

  // Match schemas from the DataSchema
  const schemaTables = 'tables' in schema ? schema.tables : [];
  const customerSchema = schemaTables.find((t) => t.name === 'customers');
  const orderSchema = schemaTables.find((t) => t.name === 'orders');
  const itemSchema = schemaTables.find((t) => t.name === 'order_items');

  if (customerSchema) tables.push({ schema: customerSchema, rows: customers });
  if (orderSchema) tables.push({ schema: orderSchema, rows: orders });
  if (itemSchema) tables.push({ schema: itemSchema, rows: finalItems });

  return tables;
}

function generateEmail(name: string, rng: SeededRNG): string {
  const parts = name.toLowerCase().split(' ');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
  return `${parts[0]}.${parts[1]}@${rng.pick(domains)}`;
}

export function generateTabularFromSchema(
  tableSchema: TableSchema,
  settings: GenerationSettings,
): GeneratedTable {
  const rows = generateRows(tableSchema.columns, settings);
  return { schema: tableSchema, rows };
}
