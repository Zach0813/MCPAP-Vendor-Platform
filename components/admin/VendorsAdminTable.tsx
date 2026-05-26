'use client';

import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { VendorModal } from '@/components/VendorModal';
import { createBrowserClient } from '@/lib/supabase/client';
import { VENDOR_STATUS, type Vendor, type VendorStatus } from '@/types';

export function VendorsAdminTable({ vendors }: { vendors: Vendor[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    // Get current user
    async function loadUserInfo() {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        // Note: Admin check would require a users table with admin role
        // For now, we just protect the current user's vendor
      }
    }

    loadUserInfo();
  }, []);

  async function updateStatus(id: string, status: VendorStatus) {
    setBusyId(id);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { error: e } = await supabase.from('vendors').update({ status }).eq('id', id);
      if (e) throw e;
      location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteVendor(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { error: e } = await supabase.from('vendors').delete().eq('id', id);
      if (e) throw e;
      location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusyId(null);
      setDeleteConfirmId(null);
    }
  }

  if (vendors.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border p-6 text-muted">
        No vendors yet. Approve an application to create one.
      </p>
    );
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mb-3 rounded border border-terracotta-300 bg-terracotta-50 p-3 text-sm text-terracotta-800 dark:border-terracotta-700 dark:bg-terracotta-900 dark:text-terracotta-100">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-card border border-border bg-surface dark:bg-sage-900">
        <table className="min-w-full divide-y divide-border text-sm dark:divide-sage-700">
          <thead className="bg-sage-50 text-left dark:bg-sage-800">
            <tr>
              <th className="px-3 py-2 text-ink dark:text-sage-100 w-16">Image</th>
              <th className="px-3 py-2 text-ink dark:text-sage-100">Contact Info</th>
              <th className="px-3 py-2 text-ink dark:text-sage-100">Category</th>
              <th className="px-3 py-2 text-ink dark:text-sage-100">Status</th>
              <th className="px-3 py-2 text-ink dark:text-sage-100">Links</th>
              <th className="px-3 py-2 text-ink dark:text-sage-100">Change</th>
              <th className="px-3 py-2 text-ink dark:text-sage-100">Details</th>
              <th className="px-3 py-2 text-right text-ink dark:text-sage-100">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendors.map((v) => (
              <tr key={v.id} title={v.description || ''}>
                <td className="px-3 py-3 text-center">
                  {v.logo_url ? (
                    <div className="h-14 w-14 mx-auto flex items-center justify-center overflow-hidden rounded-card bg-sage-50 dark:bg-sage-800 border border-border">
                      <img
                        src={v.logo_url}
                        alt={`${v.name} logo`}
                        className="max-h-14 max-w-14 object-contain"
                      />
                    </div>
                  ) : v.owner_photo_url ? (
                    <div className="h-14 w-14 mx-auto flex items-center justify-center overflow-hidden rounded-card bg-sage-50 dark:bg-sage-800 border border-border">
                      <img
                        src={v.owner_photo_url}
                        alt={`${v.name} owner`}
                        className="h-14 w-14 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 mx-auto flex items-center justify-center rounded-card bg-sage-50 dark:bg-sage-800 border border-border text-xs text-muted">
                      —
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-1">
                    <p className="font-medium text-ink">{v.name}</p>
                    {v.email && (
                      <a href={`mailto:${v.email}`} className="text-xs text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100 block truncate">
                        {v.email}
                      </a>
                    )}
                    {v.phone && (
                      <a href={`tel:${v.phone}`} className="text-xs text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100 block truncate">
                        {v.phone}
                      </a>
                    )}
                    {v.description && (
                      <p className="text-xs text-muted line-clamp-2">{v.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 capitalize text-ink dark:text-cream-50">{v.category ?? '—'}</td>
                <td className="px-3 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {v.website && (
                      <a
                        href={v.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Website"
                        className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100"
                      >
                        🌐
                      </a>
                    )}
                    {v.instagram_handle && (
                      <a
                        href={`https://instagram.com/${v.instagram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Instagram: @${v.instagram_handle}`}
                        className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100"
                      >
                        📸
                      </a>
                    )}
                    {v.facebook_handle && (
                      <a
                        href={`https://facebook.com/${v.facebook_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Facebook: ${v.facebook_handle}`}
                        className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100"
                      >
                        f
                      </a>
                    )}
                    {v.tiktok_handle && (
                      <a
                        href={`https://tiktok.com/@${v.tiktok_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`TikTok: @${v.tiktok_handle}`}
                        className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100"
                      >
                        ♪
                      </a>
                    )}
                    {!v.website && !v.instagram_handle && !v.facebook_handle && !v.tiktok_handle && (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <select
                    value={v.status}
                    disabled={busyId === v.id}
                    onChange={(e) => updateStatus(v.id, e.target.value as VendorStatus)}
                    className="min-h-touch rounded-card border border-border bg-surface px-2 text-sm text-ink"
                    suppressHydrationWarning
                  >
                    {VENDOR_STATUS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => setSelectedVendor(v)}
                    className="text-sm font-medium text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-sage-100"
                  >
                    View
                  </button>
                </td>
                <td className="px-3 py-3 text-right">
                  {(() => {
                    const isCurrentVendor = v.user_id === currentUserId;
                    const cannotDelete = isCurrentVendor;
                    const deleteReason = isCurrentVendor ? 'Cannot delete your own profile' : null;

                    return deleteConfirmId === v.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => deleteVendor(v.id)}
                          disabled={busyId === v.id || cannotDelete}
                          title={deleteReason || ''}
                          className="text-sm font-medium text-terracotta-700 hover:text-terracotta-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busyId === v.id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={busyId === v.id}
                          className="text-sm font-medium text-muted hover:text-ink disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(v.id)}
                          disabled={busyId === v.id || cannotDelete}
                          title={deleteReason || ''}
                          className="text-sm font-medium text-terracotta-700 hover:text-terracotta-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                        {cannotDelete && (
                          <span className="text-xs text-muted" title={deleteReason || ''}>
                            ⛔
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVendor && (
        <VendorModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </>
  );
}
