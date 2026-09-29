import { SeededRNG } from './rng';
import {
  FIRST_NAMES,
  LAST_NAMES,
  COMPANIES,
  PRODUCT_NAMES,
  BANK_MERCHANTS,
  INVOICE_NOTES,
} from './data-pools';
import type { Invoice, BankStatement, BankTransaction } from '@/types/documents';
import type { GenerationSettings } from '@/types/schema';

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

function generateDate(rng: SeededRNG, minYear = 2024, maxYear = 2025): string {
  const year = rng.int(minYear, maxYear);
  const month = rng.int(1, 12);
  const day = rng.int(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function generateInvoice(settings: GenerationSettings): Invoice {
  const rng = new SeededRNG(settings.seed);
  const customerName = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
  const companyName = rng.pick(COMPANIES);
  const invoiceDate = generateDate(rng, 2024, 2025);
  const dueDate = addDays(invoiceDate, 30);
  const invoiceNumber = `INV-${rng.int(10000, 99999)}`;

  const numItems = rng.int(3, 8);
  const lineItems = [];
  let subtotal = 0;

  for (let i = 0; i < numItems; i++) {
    const quantity = rng.int(1, 15);
    const unitPrice = Math.round(rng.float(10, 800) * 100) / 100;
    const lineSubtotal = Math.round(quantity * unitPrice * 100) / 100;
    subtotal = Math.round((subtotal + lineSubtotal) * 100) / 100;

    lineItems.push({
      id: generateUUID(rng),
      description: rng.pick(PRODUCT_NAMES),
      quantity,
      unitPrice,
      subtotal: lineSubtotal,
    });
  }

  const taxRate = rng.pick([0, 0.05, 0.07, 0.08, 0.0825, 0.1]);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    invoiceNumber,
    companyName,
    customerName,
    customerEmail: `${customerName.toLowerCase().replace(' ', '.')}@email.com`,
    invoiceDate,
    dueDate,
    lineItems,
    subtotal,
    taxRate,
    taxAmount,
    total,
    currency: settings.currency,
    notes: rng.pick(INVOICE_NOTES),
  };
}

export function generateBankStatement(
  settings: GenerationSettings,
  periodDays = 90,
  minBalance = 0,
): BankStatement {
  const rng = new SeededRNG(settings.seed);
  const accountHolder = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
  const accountNumber = `${String(rng.int(1000000000, 9999999999))}`;
  const maskedAccount = `****${accountNumber.slice(-4)}`;
  const statementDate = generateDate(rng, 2025, 2025);

  const startingBalance = Math.round(rng.float(1000, 10000) * 100) / 100;
  let balance = startingBalance;

  const numTransactions = rng.int(30, 60);
  const transactions: BankTransaction[] = [];

  for (let i = 0; i < numTransactions; i++) {
    const date = addDays(statementDate, -(numTransactions - i) * Math.floor(periodDays / numTransactions));
    const description = rng.pick(BANK_MERCHANTS);
    const isDebit = rng.chance(0.65);

    let debit: number | null = null;
    let credit: number | null = null;

    if (isDebit) {
      debit = Math.round(rng.float(5, 500) * 100) / 100;
      balance = Math.round((balance - debit) * 100) / 100;
    } else {
      credit = Math.round(rng.float(100, 3000) * 100) / 100;
      balance = Math.round((balance + credit) * 100) / 100;
    }

    transactions.push({
      id: generateUUID(rng),
      date,
      description,
      debit,
      credit,
      balance,
    });
  }

  const filtered = minBalance > 0
    ? transactions.filter((t) => t.balance > minBalance)
    : transactions;

  return {
    accountHolder,
    accountNumber: maskedAccount,
    statementDate,
    startingBalance,
    endingBalance: balance,
    transactions: filtered,
    currency: settings.currency,
    period: `Last ${periodDays} days`,
  };
}
