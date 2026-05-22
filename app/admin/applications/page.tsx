import { createServerClient } from '@/lib/supabase/server';
import { ApplicationsTable } from '@/components/admin/ApplicationsTable';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const supabase = await createServerClient();
  const { data: applications, error } = await supabase
    .from('vendor_applications')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-sage-900">Vendor Applications</h1>
        <p className="mt-2 text-muted">
          Review, approve, or reject incoming applications. Approval auto-creates a vendor row and emails a magic link.
        </p>
      </header>
      {error ? (
        <p className="rounded-card border border-terracotta-300 bg-terracotta-50 p-4 text-terracotta-800">
          Failed to load applications: {error.message}
        </p>
      ) : (
        <ApplicationsTable applications={applications ?? []} />
      )}
    </>
  );
}
