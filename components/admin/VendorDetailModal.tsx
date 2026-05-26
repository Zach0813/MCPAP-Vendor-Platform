'use client';

import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Vendor } from '@/types';

interface VendorDetailModalProps {
  vendor: Vendor;
  isOpen: boolean;
  onClose: () => void;
}

export function VendorDetailModal({ vendor, isOpen, onClose }: VendorDetailModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title={vendor.name}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Status and Category */}
        <div className="flex items-center gap-3">
          <StatusBadge status={vendor.status} />
          <span className="text-sm text-muted capitalize">{vendor.category ?? 'No category'}</span>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-muted mb-1">Email</h3>
            {vendor.email ? (
              <a href={`mailto:${vendor.email}`} className="text-ink hover:text-sage-700 break-all">
                {vendor.email}
              </a>
            ) : (
              <p className="text-muted">—</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted mb-1">Phone</h3>
            {vendor.phone ? (
              <a href={`tel:${vendor.phone}`} className="text-ink hover:text-sage-700">
                {vendor.phone}
              </a>
            ) : (
              <p className="text-muted">—</p>
            )}
          </div>
        </div>

        {/* Website */}
        {vendor.website && (
          <div>
            <h3 className="text-sm font-semibold text-muted mb-2">Website</h3>
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100 break-all"
            >
              {vendor.website}
            </a>
          </div>
        )}

        {/* Social Media */}
        {(vendor.instagram_handle || vendor.facebook_handle || vendor.tiktok_handle) && (
          <div>
            <h3 className="text-sm font-semibold text-muted mb-2">Social Media</h3>
            <div className="space-y-1">
              {vendor.instagram_handle && (
                <p className="text-sm">
                  <span className="text-muted">Instagram:</span>{' '}
                  <a
                    href={`https://instagram.com/${vendor.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100"
                  >
                    @{vendor.instagram_handle}
                  </a>
                </p>
              )}
              {vendor.facebook_handle && (
                <p className="text-sm">
                  <span className="text-muted">Facebook:</span> {vendor.facebook_handle}
                </p>
              )}
              {vendor.tiktok_handle && (
                <p className="text-sm">
                  <span className="text-muted">TikTok:</span>{' '}
                  <a
                    href={`https://tiktok.com/@${vendor.tiktok_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100"
                  >
                    @{vendor.tiktok_handle}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {vendor.description && (
          <div>
            <h3 className="text-sm font-semibold text-muted mb-2">Description</h3>
            <p className="text-sm text-ink leading-relaxed">{vendor.description}</p>
          </div>
        )}

        {/* Photos */}
        <div className="space-y-4">
          {vendor.logo_url && (
            <div>
              <h3 className="text-sm font-semibold text-muted mb-2">Logo</h3>
              <img
                src={vendor.logo_url}
                alt={`${vendor.name} logo`}
                className="h-20 w-auto rounded-card border border-border object-contain"
              />
            </div>
          )}
          {vendor.owner_photo_url && (
            <div>
              <h3 className="text-sm font-semibold text-muted mb-2">Owner Photo</h3>
              <img
                src={vendor.owner_photo_url}
                alt={`${vendor.name} owner`}
                className="h-32 w-32 rounded-card border border-border object-cover"
              />
            </div>
          )}
          {vendor.featured_photo_url && (
            <div>
              <h3 className="text-sm font-semibold text-muted mb-2">Featured Photo</h3>
              <img
                src={vendor.featured_photo_url}
                alt={`${vendor.name} featured`}
                className="h-48 w-full rounded-card border border-border object-cover"
              />
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="border-t border-border pt-4 space-y-3">
          {vendor.event_years && vendor.event_years.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted mb-1">Event Years</h3>
              <p className="text-sm text-ink">{vendor.event_years.join(', ')}</p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-muted mb-1">Created</h3>
            <p className="text-sm text-ink">{new Date(vendor.created_at).toLocaleDateString()}</p>
          </div>
          {vendor.user_id && (
            <div>
              <h3 className="text-sm font-semibold text-muted mb-1">User ID</h3>
              <p className="text-xs text-muted font-mono break-all">{vendor.user_id}</p>
            </div>
          )}
          {vendor.map_position && (
            <div>
              <h3 className="text-sm font-semibold text-muted mb-1">Map Position</h3>
              <p className="text-xs text-muted font-mono">
                {JSON.stringify(vendor.map_position)}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
