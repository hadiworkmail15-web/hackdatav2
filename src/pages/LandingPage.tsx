import {
  Sparkles,
  Table2,
  Network,
  FileText,
  ArrowRight,
  Shield,
  Zap,
  Database,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/ui/ThemeProvider';
import { Moon, Sun } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const { theme, toggle } = useTheme();

  const features = [
    {
      icon: <Table2 className="w-6 h-6" style={{ color: 'rgb(var(--primary))' }} />,
      title: 'Tabular Data',
      description: 'Generate realistic rows from custom schemas with 13 semantic types including names, emails, dates, currency, and more.',
      tag: '13 semantic types',
    },
    {
      icon: <Network className="w-6 h-6" style={{ color: 'rgb(var(--accent))' }} />,
      title: 'Relational Data',
      description: 'Build multi-table datasets with foreign keys, dependency-ordered generation, and automatic total reconciliation.',
      tag: 'FK integrity enforced',
    },
    {
      icon: <FileText className="w-6 h-6" style={{ color: 'rgb(var(--warning))' }} />,
      title: 'Documents',
      description: 'Generate professional invoices and bank statements with calculated totals, running balances, and printable views.',
      tag: 'Invoices + statements',
    },
  ];

  const stats = [
    { label: 'Semantic Types', value: '13' },
    { label: 'Validation Checks', value: '7' },
    { label: 'Export Formats', value: '4' },
    { label: 'Avg. Generation', value: '<1s' },
  ];

  const steps = [
    { icon: <Code2 className="w-5 h-5" />, title: 'Define Schema', desc: 'Build columns with semantic types, constraints, and keys' },
    { icon: <Sparkles className="w-5 h-5" />, title: 'AI Analysis', desc: 'Get intelligent recommendations and edge-case detection' },
    { icon: <Database className="w-5 h-5" />, title: 'Generate', desc: 'Produce thousands of realistic rows in milliseconds' },
    { icon: <CheckCircle2 className="w-5 h-5" />, title: 'Validate & Export', desc: 'Run integrity checks and export to CSV, JSON, or ZIP' },
  ];

  return (
    <div className="min-h-screen bg-app">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-surface/80 border-b border-default">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent)))' }}>
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-default">SynthForge</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="btn-ghost p-2">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button onClick={onStart} size="sm">
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(ellipse at top, rgba(var(--primary) / 0.15), transparent 60%)',
        }} />
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgb(var(--primary-light))' }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'rgb(var(--primary))' }} />
              <span className="text-xs font-medium" style={{ color: 'rgb(var(--primary))' }}>AI-Powered Synthetic Data Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-default tracking-tight mb-6">
              Synth<span style={{ color: 'rgb(var(--primary))' }}>Forge</span>
            </h1>
            <p className="text-xl text-muted mb-4 leading-relaxed">
              Generate realistic, privacy-safe synthetic data for development, testing and demos.
            </p>
            <p className="text-base text-muted/80 mb-8 max-w-xl mx-auto">
              Schema-aware, realistic, validated synthetic data — generated on demand.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={onStart} size="lg">
                Start Generating
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <div className="text-2xl font-bold text-default">{s.value}</div>
                <div className="text-xs text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:border-primary transition-all group animate-fade-in" style={{ transition: 'border-color 0.2s' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-default text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed mb-3">{f.description}</p>
              <span className="badge" style={{ backgroundColor: 'rgb(var(--primary-light))', color: 'rgb(var(--primary))' }}>
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-default mb-2">How It Works</h2>
          <p className="text-muted">From schema to export in four steps</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent)))' }}>
                    {i + 1}
                  </div>
                  <div style={{ color: 'rgb(var(--primary))' }}>{step.icon}</div>
                </div>
                <h4 className="font-semibold text-default text-sm mb-1">{step.title}</h4>
                <p className="text-xs text-muted">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-3 w-4 h-4 text-muted" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6">
            <Shield className="w-8 h-8 mb-3" style={{ color: 'rgb(var(--success))' }} />
            <h3 className="font-semibold text-default mb-2">Privacy-Safe</h3>
            <p className="text-sm text-muted">No real PII ever touches your dataset. Every value is synthetically generated from scratch.</p>
          </div>
          <div className="card p-6">
            <Zap className="w-8 h-8 mb-3" style={{ color: 'rgb(var(--warning))' }} />
            <h3 className="font-semibold text-default mb-2">Fast Generation</h3>
            <p className="text-sm text-muted">Thousands of rows generated in milliseconds using deterministic seeded RNG — no API calls needed.</p>
          </div>
          <div className="card p-6">
            <CheckCircle2 className="w-8 h-8 mb-3" style={{ color: 'rgb(var(--primary))' }} />
            <h3 className="font-semibold text-default mb-2">Validated Output</h3>
            <p className="text-sm text-muted">7 automated checks: PK uniqueness, FK integrity, null rates, outliers, and total reconciliation.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="card p-10 text-center" style={{ background: 'linear-gradient(135deg, rgb(var(--surface)), rgb(var(--surface-2)))' }}>
          <h2 className="text-3xl font-bold text-default mb-3">Ready to generate?</h2>
          <p className="text-muted mb-6">Load a demo schema and produce a full dataset in seconds.</p>
          <Button onClick={onStart} size="lg">
            Start Generating
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-default">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" style={{ color: 'rgb(var(--primary))' }} />
            <span className="text-sm font-semibold text-default">SynthForge</span>
          </div>
          <p className="text-xs text-muted">Built for university hackathon demo</p>
        </div>
      </footer>
    </div>
  );
}
