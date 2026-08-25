import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  size = 'md',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full bg-neutral-800 overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', barClassName ?? 'bg-primary-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-neutral-400 tabular-nums w-9 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
