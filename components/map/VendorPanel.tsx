'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Vendor } from '@/types';

interface VendorPanelProps {
  vendor: Vendor | null;
  onClose: () => void;
}

/**
 * Vendor detail panel.
 * - Desktop (>= sm): pinned to the right edge as a sidebar.
 * - Mobile: slides up from the bottom as a sheet.
 */
export function VendorPanel({ vendor, onClose }: VendorPanelProps) {
  const open = !!vendor;
  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-20 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-96',
        'transition-transform duration-300 ease-out',
        open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
      )}
    >
      <div className="pointer-events-auto h-full max-h-[80vh] overflow-y-auto rounded-t-card border border-border bg-surface p-6 shadow-panel sm:max-h-none sm:rounded-none sm:rounded-l-card">
        {vendor ? (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-display text-xl font-semibold text-sage-900">{vendor.name || 'Unnamed Vendor'}</h3>
                {vendor.category ? (
                  <span className="mt-1 inline-block rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-800">
                    {vendor.category}
                  </span>
                ) : null}
              </div>
              <button
                onClick={onClose}
                aria-label="Close vendor details"
                className="inline-flex min-h-touch min-w-touch items-center justify-center rounded text-muted hover:bg-sage-50"
              >
                ✕
              </button>
            </div>

            {vendor.logo_url ? (
              <div className="mb-4 overflow-hidden rounded-card border border-border">
                <Image
                  src={vendor.logo_url}
                  alt={`${vendor.name} logo`}
                  width={384}
                  height={216}
                  className="h-40 w-full object-cover"
                />
              </div>
            ) : null}

            {vendor.description ? (
              <p className="mb-3 text-sm text-muted">{vendor.description}</p>
            ) : null}

            <div className="space-y-2 text-sm">
              {vendor.phone ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">📞</span>
                  <a href={`tel:${vendor.phone}`} className="text-sage-700 hover:underline">
                    {vendor.phone}
                  </a>
                </div>
              ) : null}
              {vendor.email ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">✉️</span>
                  <a href={`mailto:${vendor.email}`} className="text-sage-700 hover:underline">
                    {vendor.email}
                  </a>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {vendor.website ? (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-touch items-center rounded-card bg-sage-700 px-4 text-sm font-medium text-cream-50 hover:bg-sage-800"
                >
                  Website
                </a>
              ) : null}
              {vendor.instagram_handle ? (
                <a
                  href={`https://instagram.com/${vendor.instagram_handle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-touch items-center rounded-card border border-sage-300 px-4 text-sm font-medium text-sage-800 hover:bg-sage-50"
                >
                  Instagram
                </a>
              ) : null}
              {vendor.facebook_handle ? (
                <a
                  href={`https://facebook.com/${vendor.facebook_handle.replace(/^\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-touch items-center rounded-card border border-sage-300 px-4 text-sm font-medium text-sage-800 hover:bg-sage-50"
                >
                  Facebook
                </a>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}
