import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function VendorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS ensures we only get this user's own vendor row.
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user!.id)
    .maybeSingle();

  return (
    <>
      {notice === 'not_admin' ? (
        <div
          role="status"
          className="mb-6 rounded-card border border-terracotta-300 bg-terracotta-50 p-4 text-sm text-terracotta-900 dark:border-terracotta-700 dark:bg-terracotta-950 dark:text-terracotta-200"
        >
          Admin access requires the <code className="rounded bg-white/60 px-1 dark:bg-sage-700 dark:text-cream-50">admin</code> role on your
          account. In Supabase, run <code className="rounded bg-white/60 px-1 dark:bg-sage-700 dark:text-cream-50">supabase/scripts/promote-admin.sql</code>{' '}
          with your email, then sign out and sign back in before visiting <code className="rounded bg-white/60 px-1 dark:bg-sage-700 dark:text-cream-50">/admin</code>.
        </div>
      ) : null}

      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">
          Welcome back{vendor?.name ? `, ${vendor.name}` : ''}
        </h1>
        <p className="mt-2 text-muted dark:text-sage-300">Manage your booth, profile, and event participation here.</p>
      </header>

      {vendor ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-card border border-border bg-surface p-6 shadow-card dark:bg-sage-900 dark:border-sage-700">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted dark:text-sage-400">Status</h2>
            <div className="mt-3"><StatusBadge status={vendor.status} /></div>
          </article>
          <Link
            href="/vendor/profile"
            className="rounded-card border border-border bg-surface p-6 shadow-card hover:border-sage-300 dark:bg-sage-900 dark:border-sage-700 dark:hover:border-sage-600"
          >
            <h2 className="font-display text-lg font-semibold text-sage-800 dark:text-cream-50">Edit profile</h2>
            <p className="mt-2 text-sm text-muted dark:text-sage-300">Update your name, description, logo, and social links.</p>
          </Link>
          <Link
            href="/vendor/requests"
            className="rounded-card border border-border bg-surface p-6 shadow-card hover:border-sage-300 dark:bg-sage-900 dark:border-sage-700 dark:hover:border-sage-600"
          >
            <h2 className="font-display text-lg font-semibold text-sage-800 dark:text-cream-50">Event requests</h2>
            <p className="mt-2 text-sm text-muted dark:text-sage-300">Submit participation, cancellation, or change requests.</p>
          </Link>
        </section>
      ) : (
        <p className="rounded-card border border-dashed border-border p-6 text-muted dark:border-sage-700 dark:text-sage-300">
          Your vendor profile hasn&apos;t been created yet. If you just applied, hang tight — once approved you&apos;ll
          see your dashboard here.
        </p>
      )}
    </>
  );
}
