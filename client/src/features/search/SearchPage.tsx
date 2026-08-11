import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  return (
    <div className="min-h-full">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Search</h1>
        {q && <span className="text-sm text-ink-secondary">for “{q}”</span>}
      </header>
      <div className="flex flex-col items-center gap-4 px-6 py-16">
        <EmptyState
          title="Advanced search is coming soon"
          hint="Full-text search across boards, cards, members, labels, and attachments will live here."
        />
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  );
}
