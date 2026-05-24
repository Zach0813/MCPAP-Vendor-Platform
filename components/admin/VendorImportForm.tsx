'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { VENDOR_CATEGORY, VENDOR_STATUS, type Vendor } from '@/types';
import { Button } from '@/components/ui/Button';

export function VendorImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have header row and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines

      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const validateVendor = (row: Record<string, string>): [boolean, string | null] => {
    if (!row.name || !row.name.trim()) {
      return [false, 'Name is required'];
    }
    if (row.category && !VENDOR_CATEGORY.includes(row.category as any)) {
      return [false, `Invalid category: ${row.category}`];
    }
    if (row.status && !VENDOR_STATUS.includes(row.status as any)) {
      return [false, `Invalid status: ${row.status}`];
    }
    return [true, null];
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No vendor rows found in CSV');
      }

      const supabase = createBrowserClient();
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const [isValid, validationError] = validateVendor(row);

        if (!isValid) {
          errors.push(`Row ${i + 2}: ${validationError}`);
          continue;
        }

        try {
          // Build vendor object, skipping empty fields
          const vendorData: Partial<Vendor> = {
            name: row.name.trim(),
            status: (row.status?.trim() || 'pending') as any,
          };

          if (row.email?.trim()) vendorData.email = row.email.trim();
          if (row.phone?.trim()) vendorData.phone = row.phone.trim();
          if (row.category?.trim()) vendorData.category = row.category.trim() as any;
          if (row.website?.trim()) vendorData.website = row.website.trim();
          if (row.instagram_handle?.trim()) vendorData.instagram_handle = row.instagram_handle.trim();
          if (row.facebook_handle?.trim()) vendorData.facebook_handle = row.facebook_handle.trim();
          if (row.tiktok_handle?.trim()) vendorData.tiktok_handle = row.tiktok_handle.trim();
          if (row.description?.trim()) vendorData.description = row.description.trim();

          const { error: insertError } = await supabase.from('vendors').insert([vendorData]);

          if (insertError) {
            errors.push(`Row ${i + 2} (${row.name}): ${insertError.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          errors.push(
            `Row ${i + 2} (${row.name}): ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      setResult({
        success: successCount,
        failed: rows.length - successCount,
        errors: errors.slice(0, 10), // Show first 10 errors
      });

      if (successCount > 0) {
        // Refresh page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h3 className="font-semibold text-ink mb-3">Import Vendors from CSV</h3>

      {error ? (
        <p role="alert" className="mb-3 rounded border border-terracotta-300 bg-terracotta-50 p-2 text-sm text-terracotta-800">
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          role="status"
          className={`mb-3 rounded border p-3 text-sm ${
            result.failed === 0
              ? 'border-sage-300 bg-sage-50 text-sage-800'
              : 'border-amber-300 bg-amber-50 text-amber-800'
          }`}
        >
          <p className="font-medium">
            ✓ {result.success} imported {result.failed > 0 ? `• ✗ ${result.failed} failed` : ''}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {result.errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
              {result.errors.length === 10 && <li>• ... and more</li>}
            </ul>
          )}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setResult(null);
          }}
          disabled={loading}
          className="flex-1 text-sm"
        />
        <Button onClick={handleImport} disabled={!file || loading} type="button">
          {loading ? 'Importing...' : '↑ Import'}
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted">
        CSV should have columns: name, email, phone, category, website, instagram_handle, facebook_handle, tiktok_handle, description, status
      </p>
    </div>
  );
}
