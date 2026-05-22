'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Vendor } from '@/types';
import { cn } from '@/lib/utils';

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

/**
 * Modal showing full vendor details and product photos
 */
interface VendorModalProps {
  vendor: Vendor;
  onClose: () => void;
}

function VendorModal({ vendor, onClose }: VendorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card bg-surface shadow-lg dark:bg-sage-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-6 py-4 dark:bg-sage-900 dark:border-sage-700">
          <h2 className="font-display text-2xl font-semibold text-sage-900 dark:text-cream-50">{vendor.name}</h2>
          <button
            onClick={onClose}
            className="rounded px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-100 transition dark:text-sage-300 dark:hover:bg-sage-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Logo */}
          {vendor.logo_url && (
            <div className="flex items-center justify-center overflow-hidden rounded-card bg-sage-50 p-6 dark:bg-sage-800" style={{ minHeight: '300px' }}>
              <Image
                src={vendor.logo_url}
                alt={`${vendor.name} logo`}
                width={400}
                height={400}
                className="max-h-72 w-auto object-contain"
              />
            </div>
          )}

          {/* Basic Info */}
          <div>
            <div className="flex flex-wrap gap-2 items-center">
              {vendor.category && (
                <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-medium text-sage-800 capitalize dark:bg-sage-700 dark:text-sage-100">
                  {vendor.category}
                </span>
              )}
              {vendor.status && (
                <span className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium',
                  vendor.status === 'approved'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-sage-100 text-sage-800 dark:bg-sage-700 dark:text-sage-100'
                )}>
                  {vendor.status}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {vendor.description && (
            <div>
              <h3 className="mb-2 font-medium text-sage-900 dark:text-cream-50">About</h3>
              <p className="text-sage-700 dark:text-sage-300">{vendor.description}</p>
            </div>
          )}

          {/* Owner Photo */}
          {vendor.owner_photo_url && (
            <div>
              <h3 className="mb-2 font-medium text-sage-900 dark:text-cream-50">Owner</h3>
              <div className="flex items-center justify-center overflow-hidden rounded-card bg-sage-50 p-6 dark:bg-sage-800" style={{ minHeight: '320px' }}>
                <Image
                  src={vendor.owner_photo_url}
                  alt={`${vendor.name} owner`}
                  width={400}
                  height={400}
                  className="max-h-80 w-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* Product Photos */}
          {vendor.featured_photo_url && (
            <div>
              <h3 className="mb-2 font-medium text-sage-900 dark:text-cream-50">Featured Products</h3>
              <div className="overflow-hidden rounded-card bg-sage-50 dark:bg-sage-800">
                <Image
                  src={vendor.featured_photo_url}
                  alt={`${vendor.name} products`}
                  width={600}
                  height={400}
                  className="h-80 w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-3 rounded-card border border-border bg-sage-50 p-4 dark:bg-sage-800 dark:border-sage-700">
            <h3 className="font-medium text-sage-900 dark:text-cream-50">Contact & Links</h3>
            <div className="space-y-2 text-sm">
              {vendor.email && (
                <a
                  href={`mailto:${vendor.email}`}
                  className="flex items-center gap-2 text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50"
                >
                  <span>📧</span> {vendor.email}
                </a>
              )}
              {vendor.phone && (
                <a
                  href={`tel:${vendor.phone}`}
                  className="flex items-center gap-2 text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50"
                >
                  <span>📞</span> {vendor.phone}
                </a>
              )}
              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50"
                >
                  <span>🔗</span> Visit website
                </a>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(vendor.instagram_handle || vendor.facebook_handle || vendor.tiktok_handle) && (
            <div className="space-y-3 rounded-card border border-border bg-sage-50 p-4 dark:bg-sage-800 dark:border-sage-700">
              <h3 className="font-medium text-sage-900 dark:text-cream-50">Follow Us</h3>
              <div className="space-y-2 text-sm">
                {vendor.instagram_handle && (
                  <p className="flex items-center gap-2 text-sage-700 dark:text-sage-300">
                    <span>📸</span> @{vendor.instagram_handle} (Instagram)
                  </p>
                )}
                {vendor.facebook_handle && (
                  <p className="flex items-center gap-2 text-sage-700 dark:text-sage-300">
                    <span>👥</span> {vendor.facebook_handle} (Facebook)
                  </p>
                )}
                {vendor.tiktok_handle && (
                  <p className="flex items-center gap-2 text-sage-700 dark:text-sage-300">
                    <span>🎵</span> @{vendor.tiktok_handle} (TikTok)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
