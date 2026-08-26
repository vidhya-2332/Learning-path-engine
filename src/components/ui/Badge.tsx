import { cn } from '@/lib/utils';
import type { Importance } from '@/lib/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-primary-500/15 text-primary-300 border border-primary-500/20',
  success: 'bg-success-500/15 text-success-400 border border-success-500/20',
  warning: 'bg-warning-500/15 text-warning-400 border border-warning-500/20',
  error: 'bg-error-500/15 text-error-400 border border-error-500/20',
  info: 'bg-secondary-500/15 text-secondary-400 border border-secondary-500/20',
  neutral: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return <span className={cn('badge', variants[variant], className)}>{children}</span>;
}

export function ImportanceBadge({ importance }: { importance: Importance }) {
  const map: Record<Importance, { variant: BadgeProps['variant']; label: string }> = {
    high: { variant: 'error', label: 'High' },
    medium: { variant: 'warning', label: 'Medium' },
    low: { variant: 'neutral', label: 'Low' },
  };
  const { variant, label } = map[importance];
  return <Badge variant={variant}>{label}</Badge>;
}
