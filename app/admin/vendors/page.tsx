import { createServerClient } from '@/lib/supabase/server';
import { VendorsAdminTable } from '@/components/admin/VendorsAdminTable';
import { VendorExportButton } from '@/components/admin/VendorExportButton';
import { VendorImportForm } from '@/components/admin/VendorImportForm';

export const dynamic = 'force-dynamic';

export default async function AdminVendorsPage() {
  const supabase = await createServerClient();
  const vendorsResult = await supabase.from('vendors').select('*').order('name', { ascending: true });

  const { data: vendors, error } = vendorsResult;

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">All Vendors</h1>
        <p className="mt-2 text-muted dark:text-sage-300">
          Manage vendor applications and status. Approved vendors appear on the public directory.
        </p>
      </header>

      {error ? (
        <p className="rounded-card border border-terracotta-300 bg-terracotta-50 p-4 text-terracotta-800 dark:border-terracotta-700 dark:bg-terracotta-900 dark:text-terracotta-100">
          Failed to load vendors: {error.message}
        </p>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-sage-900 dark:text-sage-50 mb-3">Import / Export</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <VendorImportForm />
              <div className="rounded-card border border-border bg-surface p-4 flex flex-col">
                <h3 className="font-semibold text-ink mb-3">Export All Vendors</h3>
                <p className="text-sm text-muted mb-3 flex-1">
                  Download all vendors as CSV for backup or external management.
                </p>
                <VendorExportButton vendors={vendors ?? []} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-sage-900 dark:text-sage-50 mb-3">Vendor Details</h2>
            <p className="text-sm text-muted dark:text-sage-300 mb-4">
              Click on any vendor to view full details. Update status or delete vendors from this list.
            </p>
            <VendorsAdminTable vendors={vendors ?? []} />
          </section>
        </>
      )}
    </>
  );
}
