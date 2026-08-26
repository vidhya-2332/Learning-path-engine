import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-neutral-700 border-t-primary-500',
        sizes[size],
        className,
      )}
    />
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner size="lg" />
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-neutral-600">{icon}</div>}
      <h3 className="text-base font-medium text-neutral-300">{title}</h3>
      {description && <p className="text-sm text-neutral-500 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-error-500/10 flex items-center justify-center">
        <span className="text-error-400 text-xl">!</span>
      </div>
      <h3 className="text-base font-medium text-neutral-300">Something went wrong</h3>
      <p className="text-sm text-neutral-500 max-w-sm">{message}</p>
    </div>
  );
}
