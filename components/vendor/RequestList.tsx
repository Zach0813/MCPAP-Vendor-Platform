import { StatusBadge } from '@/components/ui/StatusBadge';
import type { EventRequest } from '@/types';

type EventRequestWithEvent = EventRequest & {
  events?: { year: number; name: string } | null;
};

export function RequestList({ requests }: { requests: EventRequestWithEvent[] }) {
  if (requests.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border p-6 text-muted dark:border-sage-700 dark:text-sage-300">
        You haven’t submitted any requests yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {requests.map((r) => (
        <li
          key={r.id}
          className="rounded-card border border-border bg-surface p-4 shadow-card dark:bg-sage-900 dark:border-sage-700"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium capitalize text-sage-900 dark:text-cream-50">{r.type}</p>
              <p className="text-xs text-muted dark:text-sage-400">
                {r.events?.name ?? `Event ${r.event_id}`}
                {' · '}
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          {r.message ? <p className="mt-2 text-sm text-muted dark:text-sage-300">{r.message}</p> : null}
        </li>
      ))}
    </ul>
  );
}
