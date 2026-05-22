import type { Metadata } from 'next';
import { getApprovedVendors } from '@/lib/data/vendors';
import { VendorDirectory } from '@/components/VendorDirectory';

export const metadata: Metadata = {
  title: 'Vendor Directory',
};

export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
  const vendors = await getApprovedVendors();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">Vendor Directory</h1>
        <p className="mt-2 text-muted dark:text-sage-300">
          {vendors.length} approved {vendors.length === 1 ? 'vendor' : 'vendors'} are joining us this year.
        </p>
      </header>

      {vendors.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-12 text-center dark:border-sage-700 dark:bg-sage-900">
          <p className="text-muted dark:text-sage-300">No vendors approved yet. Check back soon.</p>
        </div>
      ) : (
        <VendorDirectory vendors={vendors} />
      )}
    </div>
  );
}
