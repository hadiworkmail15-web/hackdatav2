import { type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'primary' | 'accent';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: 'rgb(var(--surface-2))', text: 'rgb(var(--text-muted))' },
  success: { bg: 'rgb(var(--success-light))', text: 'rgb(var(--success))' },
  warning: { bg: 'rgb(var(--warning-light))', text: 'rgb(var(--warning))' },
  error: { bg: 'rgb(var(--error-light))', text: 'rgb(var(--error))' },
  primary: { bg: 'rgb(var(--primary-light))', text: 'rgb(var(--primary))' },
  accent: { bg: 'rgba(45 212 191 / 0.1)', text: 'rgb(var(--accent))' },
};

export function Badge({ children, variant = 'default', icon }: BadgeProps) {
  const s = variantStyles[variant];
  return (
    <span className="badge" style={{ backgroundColor: s.bg, color: s.text }}>
      {icon}
      {children}
    </span>
  );
}

export function ValidationBadge({ passed, label }: { passed: boolean; label: string }) {
  return (
    <Badge variant={passed ? 'success' : 'error'} icon={
      passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />
    }>
      {label}
    </Badge>
  );
}

export function InfoBadge({ children }: { children: ReactNode }) {
  return <Badge variant="primary" icon={<Info className="w-3.5 h-3.5" />}>{children}</Badge>;
}
