import { createServerClient } from '@/lib/supabase/server';
import { VendorsAdminTable } from '@/components/admin/VendorsAdminTable';
import { VendorMapEditorWrapper } from '@/components/admin/VendorMapEditorWrapper';
import { getCurrentEvent } from '@/lib/data/events';

export const dynamic = 'force-dynamic';

export default async function AdminVendorsPage() {
  const supabase = await createServerClient();
  const [vendorsResult, event] = await Promise.all([
    supabase.from('vendors').select('*').order('name', { ascending: true }),
    getCurrentEvent(),
  ]);

  const { data: vendors, error } = vendorsResult;

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-sage-900">All Vendors</h1>
        <p className="mt-2 text-muted">
          Update status, edit details, or suspend a vendor. Changes here are immediately visible publicly if status=approved.
        </p>
      </header>

      {error ? (
        <p className="rounded-card border border-terracotta-300 bg-terracotta-50 p-4 text-terracotta-800">
          Failed to load vendors: {error.message}
        </p>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-sage-900 mb-3">Position Vendors on Map</h2>
            <p className="text-sm text-muted mb-4">
              Drag pins to set coordinates, or enter lat/lng manually. Set booth size (default 10x10 feet).
            </p>
            <VendorMapEditorWrapper vendors={vendors ?? []} eventMapConfig={event?.map_config ?? null} />
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-sage-900 mb-3">Vendor Details</h2>
            <VendorsAdminTable vendors={vendors ?? []} />
          </section>
        </>
      )}
    </>
  );
}
