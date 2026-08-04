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
      className={`mx-auto flex max-w-xl flex-col items-center rounded-xl border border-border bg-card text-center ${compact ? 'p-6' : 'p-10'}`}
    >
      <Icon className={kind === 'error' ? 'mb-4 text-red-400' : 'mb-4 text-muted-foreground'} size={32} aria-hidden="true" />
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
