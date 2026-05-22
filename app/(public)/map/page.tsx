import type { Metadata } from 'next';
import { MapView } from '@/components/map/MapView';
import { getApprovedVendorsForMap } from '@/lib/data/vendors';
import { getCurrentEvent } from '@/lib/data/events';

export const metadata: Metadata = {
  title: 'Vendor Map',
  description: 'Find every vendor at Magic City Plant-A-Palooza on the interactive map.',
};

// Force dynamic so vendor list and event config always reflect latest data.
export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const [vendors, event] = await Promise.all([
    getApprovedVendorsForMap(),
    getCurrentEvent(),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-surface px-4 py-4 sm:px-6 dark:bg-sage-900 dark:border-sage-700">
        <h1 className="font-display text-2xl font-semibold text-sage-900 dark:text-cream-50">Vendor Map</h1>
        <p className="text-sm text-muted dark:text-sage-300">
          Tap any pin to see vendor details. Use the category filter to narrow your search.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <MapView vendors={vendors} eventMapConfig={event?.map_config ?? null} />
      </div>
    </div>
  );
}
