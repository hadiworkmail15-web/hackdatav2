import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const pad = padding === 'none' ? '' : padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6';
  return <div className={`card ${pad} ${className}`}>{children}</div>;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--primary-light))' }}>
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-default">{title}</h3>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
