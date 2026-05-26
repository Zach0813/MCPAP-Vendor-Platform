'use client';

import type { Vendor } from '@/types';
import { cn } from '@/lib/utils';

interface VendorModalProps {
  vendor: Vendor;
  onClose: () => void;
}

/**
 * Modal showing full vendor details and product photos.
 * Used by both public VendorDirectory and admin VendorDetailModal.
 */
export function VendorModal({ vendor, onClose }: VendorModalProps) {
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
              <img
                src={vendor.logo_url}
                alt={`${vendor.name} logo`}
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
                <img
                  src={vendor.owner_photo_url}
                  alt={`${vendor.name} owner`}
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
                <img
                  src={vendor.featured_photo_url}
                  alt={`${vendor.name} products`}
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
