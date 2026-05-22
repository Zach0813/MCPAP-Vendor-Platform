import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  href?: string;
  tone?: 'sage' | 'terracotta';
}

export function StatCard({ label, value, href, tone = 'sage' }: StatCardProps) {
  const card = (
    <div
      className={cn(
        'rounded-card border bg-surface p-6 shadow-card transition',
        tone === 'sage' ? 'border-sage-200' : 'border-terracotta-200',
        href && 'hover:-translate-y-0.5 hover:shadow-panel'
      )}
    >
      <p className="text-sm font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-4xl font-semibold',
          tone === 'sage' ? 'text-sage-800' : 'text-terracotta-700'
        )}
      >
        {value}
      </p>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
