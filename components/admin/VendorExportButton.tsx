'use client';

import type { Vendor } from '@/types';
import { Button } from '@/components/ui/Button';

export function VendorExportButton({ vendors }: { vendors: Vendor[] }) {
  const handleExport = () => {
    if (vendors.length === 0) {
      alert('No vendors to export.');
      return;
    }

    // Define CSV columns
    const columns = [
      'name',
      'email',
      'phone',
      'category',
      'website',
      'instagram_handle',
      'facebook_handle',
      'tiktok_handle',
      'description',
      'status',
    ];

    // Create CSV header
    const header = columns.join(',');

    // Create CSV rows
    const rows = vendors.map((v) =>
      columns
        .map((col) => {
          let value = v[col as keyof Vendor];
          // Handle null/undefined
          if (value === null || value === undefined) {
            return '';
          }
          // Quote if contains comma or newline
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(',')
    );

    // Combine header and rows
    const csv = [header, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `vendors-export-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleExport} variant="secondary">
      ↓ Export Vendors (CSV)
    </Button>
  );
}
