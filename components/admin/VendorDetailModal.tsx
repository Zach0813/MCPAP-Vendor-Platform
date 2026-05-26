'use client';

import Image from 'next/image';
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
        {/* Category and Status Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          {vendor.category && (
            <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-medium text-sage-800 capitalize dark:bg-sage-700 dark:text-sage-100">
              {vendor.category}
            </span>
          )}
          <StatusBadge status={vendor.status} />
        </div>

        {/* Logo - Full Width Display */}
        {vendor.logo_url && (
          <div className="flex items-center justify-center overflow-hidden rounded-card bg-sage-50 p-4 dark:bg-sage-800" style={{ minHeight: '200px' }}>
            <img
              src={vendor.logo_url}
              alt={`${vendor.name} logo`}
              className="max-h-48 w-auto object-contain"
            />
          </div>
        )}

        {/* Description */}
        {vendor.description && (
          <div>
            <h3 className="mb-2 font-medium text-sage-900 dark:text-cream-50">About</h3>
            <p className="text-sage-700 dark:text-sage-300 leading-relaxed">{vendor.description}</p>
          </div>
        )}

        {/* Owner Photo */}
        {vendor.owner_photo_url && (
          <div>
            <h3 className="mb-2 font-medium text-sage-900 dark:text-cream-50">Owner</h3>
            <div className="flex items-center justify-center overflow-hidden rounded-card bg-sage-50 p-4 dark:bg-sage-800" style={{ minHeight: '250px' }}>
              <img
                src={vendor.owner_photo_url}
                alt={`${vendor.name} owner`}
                className="max-h-64 w-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* Featured Photo */}
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

        {/* Contact & Links */}
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

        {/* Admin Info */}
        <div className="border-t border-border pt-4 space-y-2 text-xs text-muted dark:text-sage-400">
          {vendor.event_years && vendor.event_years.length > 0 && (
            <p><strong>Event Years:</strong> {vendor.event_years.join(', ')}</p>
          )}
          <p><strong>Created:</strong> {new Date(vendor.created_at).toLocaleDateString()}</p>
          {vendor.user_id && (
            <p className="font-mono break-all"><strong>User ID:</strong> {vendor.user_id}</p>
          )}
          {vendor.map_position && (
            <p className="font-mono break-all"><strong>Map:</strong> {JSON.stringify(vendor.map_position)}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
