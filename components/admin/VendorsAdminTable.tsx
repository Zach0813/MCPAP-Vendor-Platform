'use client';

import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { createBrowserClient } from '@/lib/supabase/client';
import { VENDOR_STATUS, type Vendor, type VendorStatus } from '@/types';

export function VendorsAdminTable({ vendors }: { vendors: Vendor[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

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
        <p role="alert" className="mb-3 rounded border border-terracotta-300 bg-terracotta-50 p-3 text-sm text-terracotta-800">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-sage-50 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Change</th>
              <th className="px-3 py-2 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className="px-3 py-3">
                  <p className="font-medium text-ink">{v.name}</p>
                  {v.email ? <p className="text-xs text-muted">{v.email}</p> : null}
                </td>
                <td className="px-3 py-3 capitalize text-ink">{v.category ?? '—'}</td>
                <td className="px-3 py-3"><StatusBadge status={v.status} /></td>
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
    </>
  );
}
