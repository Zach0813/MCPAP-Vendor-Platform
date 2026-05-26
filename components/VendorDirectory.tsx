'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Vendor } from '@/types';
import { VendorModal } from './VendorModal';

interface VendorDirectoryProps {
  vendors: Vendor[];
}

/**
 * Vendor directory with card list and detail modal
 * Shows vendor logo in list view, opens modal with full details on click
 */
export function VendorDirectory({ vendors }: VendorDirectoryProps) {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vendors.map((vendor) => (
          <li key={vendor.id}>
            <button
              onClick={() => setSelectedVendor(vendor)}
              className="w-full h-full rounded-card border border-border bg-surface p-4 shadow-card transition hover:shadow-lg hover:border-sage-300 text-left flex flex-col dark:bg-sage-900 dark:border-sage-700 dark:hover:border-sage-600"
            >
              {/* Logo/Image */}
              {vendor.logo_url && (
                <div className="mb-3 h-32 w-full flex items-center justify-center overflow-hidden rounded-card bg-sage-50 dark:bg-sage-800">
                  <Image
                    src={vendor.logo_url}
                    alt={`${vendor.name} logo`}
                    width={320}
                    height={160}
                    className="max-h-32 w-auto object-contain"
                  />
                </div>
              )}

              {/* Vendor Name */}
              <h2 className="font-display text-base font-semibold text-sage-800 dark:text-cream-50">{vendor.name}</h2>

              {/* Category */}
              {vendor.category && (
                <span className="mt-1 inline-block rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-800 capitalize w-fit dark:bg-sage-700 dark:text-sage-100">
                  {vendor.category}
                </span>
              )}

              {/* Description - Fixed 2 lines height */}
              <p className="mt-2 line-clamp-2 text-sm text-muted min-h-10 flex-grow dark:text-sage-300">{vendor.description || ''}</p>

              {/* Click indicator */}
              <p className="mt-3 text-xs text-sage-600 hover:text-sage-700 dark:text-sage-400 dark:hover:text-sage-300">View details →</p>
            </button>
          </li>
        ))}
      </ul>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <VendorModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
      )}
    </>
  );
}
