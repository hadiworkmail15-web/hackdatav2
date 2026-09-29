import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  className = '',
  type = 'button',
}: ButtonProps) {
  const base = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost';
  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-6 py-3 text-base' : '';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizeCls} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin-slow" />}
      {children}
    </button>
  );
}
