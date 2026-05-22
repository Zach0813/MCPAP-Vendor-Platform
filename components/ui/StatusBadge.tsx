import { cn } from '@/lib/utils';
import type { VendorStatus, ApplicationStatus, RequestStatus } from '@/types';

type AnyStatus = VendorStatus | ApplicationStatus | RequestStatus;

const STYLES: Record<AnyStatus, string> = {
  pending: 'bg-cream-100 text-cream-500 border-cream-300',
  approved: 'bg-sage-100 text-sage-800 border-sage-300',
  rejected: 'bg-terracotta-100 text-terracotta-800 border-terracotta-300',
  suspended: 'bg-ink/10 text-ink border-ink/20',
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STYLES[status]
      )}
    >
      {status}
    </span>
  );
}
