'use client';

import Image from 'next/image';
import type { VendorApplication } from '@/types';
import { cn } from '@/lib/utils';

interface ApplicationDetailModalProps {
  application: VendorApplication;
  onClose: () => void;
}

export function ApplicationDetailModal({ application, onClose }: ApplicationDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-card bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-sage-900">{application.vendor_name}</h2>
            <p className="text-xs text-muted">{new Date(application.created_at).toLocaleDateString()}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-sage-900 mb-1">Contact</h3>
              <p className="text-ink">{application.contact_name}</p>
              <a href={`mailto:${application.email}`} className="text-sm text-sage-700 hover:text-sage-900">
                {application.email}
              </a>
              {application.phone && (
                <a href={`tel:${application.phone}`} className="block text-sm text-sage-700 hover:text-sage-900">
                  {application.phone}
                </a>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-sage-900 mb-1">Details</h3>
              {application.category && (
                <p className="text-sm">
                  <span className="text-muted">Category:</span> <span className="text-ink capitalize">{application.category}</span>
                </p>
              )}
              {application.website && (
                <a
                  href={application.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-sage-700 hover:text-sage-900 hover:underline"
                >
                  {application.website}
                </a>
              )}
            </div>
          </div>

          {/* Business Description */}
          <div>
            <h3 className="mb-2 font-medium text-sage-900">Business Description</h3>
            <p className="text-sage-700">{application.business_description}</p>
          </div>

          {/* Social Links */}
          {(application.social_links?.instagram || application.social_links?.facebook || application.social_links?.tiktok) && (
            <div>
              <h3 className="mb-2 font-medium text-sage-900">Social Media</h3>
              <div className="space-y-1 text-sm text-sage-700">
                {application.social_links?.instagram && (
                  <p>📸 @{application.social_links.instagram} (Instagram)</p>
                )}
                {application.social_links?.facebook && (
                  <p>👥 {application.social_links.facebook} (Facebook)</p>
                )}
                {application.social_links?.tiktok && (
                  <p>🎵 @{application.social_links.tiktok} (TikTok)</p>
                )}
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="space-y-6 border-t border-border pt-6">
            {/* Logo */}
            {application.logo_url && (
              <div>
                <h3 className="mb-3 font-medium text-sage-900">Business Logo</h3>
                <div className="overflow-hidden rounded-card bg-sage-50">
                  <Image
                    src={application.logo_url}
                    alt={`${application.vendor_name} logo`}
                    width={400}
                    height={300}
                    className="h-48 w-full object-contain p-4"
                  />
                </div>
              </div>
            )}

            {/* Owner Photo */}
            {application.owner_photo_url && (
              <div>
                <h3 className="mb-3 font-medium text-sage-900">Owner/Operator Photo</h3>
                <div className="overflow-hidden rounded-card bg-sage-50">
                  <Image
                    src={application.owner_photo_url}
                    alt={`${application.vendor_name} owner`}
                    width={400}
                    height={400}
                    className="h-64 w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Featured Product Photo */}
            {application.featured_photo_url && (
              <div>
                <h3 className="mb-3 font-medium text-sage-900">Featured Product/Booth Photo</h3>
                <div className="overflow-hidden rounded-card bg-sage-50">
                  <Image
                    src={application.featured_photo_url}
                    alt={`${application.vendor_name} products`}
                    width={600}
                    height={400}
                    className="h-80 w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
