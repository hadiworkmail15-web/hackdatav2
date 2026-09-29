export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  invoiceNumber: string;
  companyName: string;
  customerName: string;
  customerEmail: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number;
}

export interface BankStatement {
  accountHolder: string;
  accountNumber: string;
  statementDate: string;
  startingBalance: number;
  endingBalance: number;
  transactions: BankTransaction[];
  currency: string;
  period: string;
}
