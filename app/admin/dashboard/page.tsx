import { createServerClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/StatCard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createServerClient();

  // Run small counts in parallel.
  const [{ count: pendingApps }, { count: approvedVendors }, { count: pendingGallery }, { count: openRequests }] =
    await Promise.all([
      supabase.from('vendor_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('gallery').select('*', { count: 'exact', head: true }).eq('approved', false),
      supabase.from('event_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-sage-900">Admin Dashboard</h1>
        <p className="mt-2 text-muted">At-a-glance counts. Click any card to drill in.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending applications" value={pendingApps ?? 0} href="/admin/applications" tone="terracotta" />
        <StatCard label="Approved vendors" value={approvedVendors ?? 0} href="/admin/vendors" tone="sage" />
        <StatCard label="Gallery pending review" value={pendingGallery ?? 0} href="/admin/gallery" tone="terracotta" />
        <StatCard label="Open event requests" value={openRequests ?? 0} href="/admin/vendors" tone="sage" />
      </div>
    </>
  );
}
