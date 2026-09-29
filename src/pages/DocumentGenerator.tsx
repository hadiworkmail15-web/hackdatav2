import { useState } from 'react';
import {
  FileText,
  Receipt,
  Landmark,
  Play,
  Download,
  FileJson,
  Printer,
  Search,
  Calendar,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { generateInvoice, generateBankStatement } from '@/lib/document-generator';
import { invoiceToJSON, bankStatementToJSON, downloadText } from '@/lib/export';
import { DEFAULT_SETTINGS, type GenerationSettings } from '@/types/schema';
import { CURRENCY_SYMBOLS } from '@/lib/data-pools';
import type { Invoice, BankStatement } from '@/types/documents';

type DocType = 'invoice' | 'bank';

interface DocumentGeneratorProps {
  onBack: () => void;
}

export function DocumentGenerator({ onBack }: DocumentGeneratorProps) {
  const [docType, setDocType] = useState<DocType>('invoice');
  const [settings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [statement, setStatement] = useState<BankStatement | null>(null);
  const [periodDays, setPeriodDays] = useState(90);
  const [minBalance, setMinBalance] = useState(0);

  const symbol = CURRENCY_SYMBOLS[settings.currency] ?? '$';

  const fmt = (n: number) => `${symbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleGenerateInvoice = () => {
    setInvoice(generateInvoice(settings));
  };

  const handleGenerateStatement = () => {
    setStatement(generateBankStatement({ ...settings, seed: settings.seed + 1 }, periodDays, minBalance));
  };

  const handleExportInvoice = () => {
    if (!invoice) return;
    downloadText(invoiceToJSON(invoice), `${invoice.invoiceNumber}.json`, 'application/json');
  };

  const handleExportStatement = () => {
    if (!statement) return;
    downloadText(bankStatementToJSON(statement), 'bank-statement.json', 'application/json');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Top bar */}
      <header className="border-b border-default bg-surface px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(var(--warning)), rgb(var(--primary)))' }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-default text-sm">Document Generator</h1>
            <p className="text-xs text-muted">Invoices and bank statements with calculated totals</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 print:p-0">
        <div className="max-w-5xl mx-auto space-y-5 print:max-w-none print:space-y-0">
          {/* Doc type selector */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => setDocType('invoice')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${docType === 'invoice' ? 'text-white' : 'card text-muted'}`}
              style={docType === 'invoice' ? { backgroundColor: 'rgb(var(--primary))' } : {}}
            >
              <Receipt className="w-4 h-4" />
              Invoice
            </button>
            <button
              onClick={() => setDocType('bank')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${docType === 'bank' ? 'text-white' : 'card text-muted'}`}
              style={docType === 'bank' ? { backgroundColor: 'rgb(var(--primary))' } : {}}
            >
              <Landmark className="w-4 h-4" />
              Bank Statement
            </button>
          </div>

          {/* Invoice */}
          {docType === 'invoice' && (
            <div className="space-y-5">
              <Card padding="none" className="print:border-0 print:shadow-none">
                {!invoice ? (
                  <EmptyState
                    icon={<Receipt className="w-8 h-8 text-muted" />}
                    title="No invoice generated yet"
                    description="Click Generate Invoice to create a professional invoice with line items, tax, and calculated totals."
                    action={<Button onClick={handleGenerateInvoice}><Play className="w-3.5 h-3.5" />Generate Invoice</Button>}
                  />
                ) : (
                  <div className="p-8 animate-fade-in">
                    {/* Invoice header */}
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent)))' }}>
                          <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-default">{invoice.companyName}</h2>
                        <p className="text-sm text-muted">123 Business Ave, San Francisco, CA</p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-xl font-bold text-default mb-1">INVOICE</h3>
                        <p className="text-sm text-muted">{invoice.invoiceNumber}</p>
                        <div className="mt-2 space-y-0.5">
                          <p className="text-xs text-muted">Date: <span className="text-default font-medium">{invoice.invoiceDate}</span></p>
                          <p className="text-xs text-muted">Due: <span className="text-default font-medium">{invoice.dueDate}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Bill to */}
                    <div className="mb-6 pb-6 border-b border-default">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Bill To</p>
                      <p className="font-semibold text-default">{invoice.customerName}</p>
                      <p className="text-sm text-muted">{invoice.customerEmail}</p>
                    </div>

                    {/* Line items */}
                    <table className="w-full text-sm mb-6">
                      <thead>
                        <tr className="border-b border-default">
                          <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-2">Description</th>
                          <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-2">Qty</th>
                          <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-2">Unit Price</th>
                          <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.lineItems.map((item) => (
                          <tr key={item.id} className="border-b border-default">
                            <td className="py-3 text-default">{item.description}</td>
                            <td className="py-3 text-right text-muted">{item.quantity}</td>
                            <td className="py-3 text-right text-muted">{fmt(item.unitPrice)}</td>
                            <td className="py-3 text-right font-medium text-default">{fmt(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mb-6">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">Subtotal</span>
                          <span className="text-default font-medium">{fmt(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">Tax ({(invoice.taxRate * 100).toFixed(2)}%)</span>
                          <span className="text-default font-medium">{fmt(invoice.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-default">
                          <span className="font-bold text-default">Total</span>
                          <span className="font-bold text-lg" style={{ color: 'rgb(var(--primary))' }}>{fmt(invoice.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="pt-4 border-t border-default">
                      <p className="text-xs text-muted">{invoice.notes}</p>
                    </div>
                  </div>
                )}
              </Card>

              {invoice && (
                <div className="flex items-center gap-2 print:hidden">
                  <Button onClick={handleGenerateInvoice} variant="secondary" size="sm">
                    <Play className="w-3.5 h-3.5" />
                    Regenerate
                  </Button>
                  <Button onClick={handleExportInvoice} variant="secondary" size="sm">
                    <FileJson className="w-3.5 h-3.5" />
                    Download JSON
                  </Button>
                  <Button onClick={handlePrint} variant="secondary" size="sm">
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Bank Statement */}
          {docType === 'bank' && (
            <div className="space-y-5">
              {/* Query controls */}
              <Card className="print:hidden">
                <CardHeader
                  title="Statement Options"
                  subtitle="Filter and generate bank statements"
                  icon={<Search className="w-5 h-5" style={{ color: 'rgb(var(--primary))' }} />}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-muted mb-1 block flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Period
                    </label>
                    <select value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))} className="input text-sm">
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                      <option value={180}>Last 180 days</option>
                      <option value={365}>Last 365 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Min Balance Filter
                    </label>
                    <select value={minBalance} onChange={(e) => setMinBalance(Number(e.target.value))} className="input text-sm">
                      <option value={0}>No filter</option>
                      <option value={500}>Balance over $500</option>
                      <option value={1000}>Balance over $1,000</option>
                      <option value={5000}>Balance over $5,000</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleGenerateStatement} className="w-full">
                      <Play className="w-3.5 h-3.5" />
                      Generate Statement
                    </Button>
                  </div>
                </div>
              </Card>

              {!statement ? (
                <Card>
                  <EmptyState
                    icon={<Landmark className="w-8 h-8 text-muted" />}
                    title="No bank statement generated yet"
                    description="Select a period and balance filter, then click Generate Statement to produce a realistic bank statement with running balances."
                  />
                </Card>
              ) : (
                <Card padding="none" className="print:border-0 print:shadow-none">
                  <div className="p-8 animate-fade-in">
                    {/* Statement header */}
                    <div className="flex items-start justify-between mb-6 pb-6 border-b border-default">
                      <div>
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--primary)))' }}>
                          <Landmark className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-default">First National Bank</h2>
                        <p className="text-sm text-muted">Account Statement</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted">Account Holder</p>
                        <p className="font-semibold text-default">{statement.accountHolder}</p>
                        <p className="text-sm text-muted mt-2">Account Number</p>
                        <p className="font-mono text-default">{statement.accountNumber}</p>
                        <p className="text-sm text-muted mt-2">Statement Date</p>
                        <p className="text-default font-medium">{statement.statementDate}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="card p-4">
                        <p className="text-xs text-muted mb-1">Starting Balance</p>
                        <p className="text-lg font-bold text-default">{fmt(statement.startingBalance)}</p>
                      </div>
                      <div className="card p-4">
                        <p className="text-xs text-muted mb-1">Ending Balance</p>
                        <p className="text-lg font-bold text-default">{fmt(statement.endingBalance)}</p>
                      </div>
                      <div className="card p-4">
                        <p className="text-xs text-muted mb-1">Transactions</p>
                        <p className="text-lg font-bold text-default">{statement.transactions.length}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="primary">{statement.period}</Badge>
                      {minBalance > 0 && <Badge variant="accent">Balance over {fmt(minBalance)}</Badge>}
                    </div>

                    {/* Transactions */}
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-default">
                            <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-2">Date</th>
                            <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-2">Description</th>
                            <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-2">Debit</th>
                            <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-2">Credit</th>
                            <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-2">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statement.transactions.map((t) => (
                            <tr key={t.id} className="border-b border-default">
                              <td className="py-2.5 text-muted text-xs">{t.date}</td>
                              <td className="py-2.5 text-default text-xs font-medium">{t.description}</td>
                              <td className="py-2.5 text-right text-xs" style={{ color: 'rgb(var(--error))' }}>
                                {t.debit !== null ? fmt(t.debit) : '—'}
                              </td>
                              <td className="py-2.5 text-right text-xs" style={{ color: 'rgb(var(--success))' }}>
                                {t.credit !== null ? fmt(t.credit) : '—'}
                              </td>
                              <td className="py-2.5 text-right text-xs font-medium text-default">{fmt(t.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              )}

              {statement && (
                <div className="flex items-center gap-2 print:hidden">
                  <Button onClick={handleGenerateStatement} variant="secondary" size="sm">
                    <Play className="w-3.5 h-3.5" />
                    Regenerate
                  </Button>
                  <Button onClick={handleExportStatement} variant="secondary" size="sm">
                    <FileJson className="w-3.5 h-3.5" />
                    Download JSON
                  </Button>
                  <Button onClick={handlePrint} variant="secondary" size="sm">
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
