import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentStatusProps {
  kind: 'empty' | 'error';
  title: string;
  description: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function ContentStatus({
  kind,
  title,
  description,
  onRetry,
  compact = false,
}: ContentStatusProps) {
  const Icon = kind === 'error' ? AlertCircle : Inbox;

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`portfolio-surface mx-auto flex max-w-xl flex-col items-center rounded-[1.5rem] text-center ${compact ? 'p-6' : 'p-10'}`}
    >
      <Icon className={kind === 'error' ? 'mb-4 text-destructive' : 'mb-4 text-primary'} size={32} strokeWidth={1.7} aria-hidden="true" />
      <h3 className="text-xl font-display text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {kind === 'error' && onRetry && (
        <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
          Intentar de nuevo
        </Button>
      )}
    </div>
  );
}
