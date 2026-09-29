import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loader2 className={`${sz} animate-spin-slow`} style={{ color: 'rgb(var(--primary))' }} />
      {label && <span className="text-sm text-muted">{label}</span>}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-default mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgb(var(--error-light))' }}>
        <span style={{ color: 'rgb(var(--error))' }} className="text-xl font-bold">!</span>
      </div>
      <p className="text-sm text-muted mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">Try again</button>
      )}
    </div>
  );
}
