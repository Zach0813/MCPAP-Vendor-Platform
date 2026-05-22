'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import type { VendorApplication } from '@/types';

export function ApplicationsTable({ applications }: { applications: VendorApplication[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);

  async function act(id: string, decision: 'approve' | 'reject') {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}/${decision}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      // Re-fetch the page server-side.
      location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border p-6 text-muted">
        No applications yet.
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
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Business</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="px-3 py-3 text-muted">
                  {new Date(a.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-ink">{a.vendor_name}</p>
                  {a.website ? (
                    <a
                      href={a.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-terracotta-700 hover:underline"
                    >
                      {a.website}
                    </a>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <p className="text-ink">{a.contact_name}</p>
                  <p className="text-xs text-muted">{a.email}</p>
                </td>
                <td className="px-3 py-3 capitalize text-ink">{a.category}</td>
                <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedApplication(a)}
                      className="text-xs font-medium text-sage-700 hover:text-sage-900"
                    >
                      View
                    </button>
                    {a.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          loading={busyId === a.id}
                          onClick={() => act(a.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={busyId === a.id}
                          onClick={() => act(a.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted">Decided</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </>
  );
}
