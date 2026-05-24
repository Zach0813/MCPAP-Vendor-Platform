'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { VENDOR_CATEGORY, VENDOR_STATUS, type Database } from '@/types';
import { Button } from '@/components/ui/Button';

type VendorInsert = Database['public']['Tables']['vendors']['Insert'];

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
    if (row.logo_url && !/^https?:\/\/.+/.test(row.logo_url)) {
      return [false, `Invalid logo URL: ${row.logo_url}`];
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

      // Prepare vendors for duplicate checking
      const vendorsToCheck = rows.map((row) => ({
        name: row.name?.trim() || '',
        email: row.email?.trim() || '',
        phone: row.phone?.trim() || '',
      }));

      // Call server endpoint to check duplicates (bypasses RLS)
      const duplicateCheckResponse = await fetch('/api/vendors/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendors: vendorsToCheck }),
      });

      if (!duplicateCheckResponse.ok) {
        throw new Error('Failed to check for duplicates');
      }

      const { duplicates: foundDuplicates } = await duplicateCheckResponse.json();

      // Separate valid rows from duplicates
      const duplicateIndices = new Set(foundDuplicates.map((d: any) => d.index));
      const duplicates: Array<{ row: Record<string, string>; index: number; existingId: string }> = [];
      const validRows: Array<{ row: Record<string, string>; index: number }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const [isValid] = validateVendor(row);

        if (!isValid) {
          continue; // Skip validation errors
        }

        if (duplicateIndices.has(i)) {
          const dup = foundDuplicates.find((d: any) => d.index === i);
          duplicates.push({ row, index: i, existingId: dup!.existingId });
        } else {
          validRows.push({ row, index: i });
        }
      }

      // If duplicates found, ask user what to do
      let rowsToImport = validRows;
      if (duplicates.length > 0) {
        const duplicateList = duplicates
          .map((d) => `- ${d.row.name} (${d.row.email || d.row.phone || 'no contact'})`)
          .slice(0, 5)
          .join('\n');
        const moreText = duplicates.length > 5 ? `\n... and ${duplicates.length - 5} more` : '';

        const skipAll = window.confirm(
          `Found ${duplicates.length} potential duplicate(s):\n\n${duplicateList}${moreText}\n\nClick OK to skip duplicates and import only ${rowsToImport.length} new vendors.\nClick Cancel to cancel import.`
        );
        if (!skipAll) {
          throw new Error('Import cancelled');
        }
        // Continue with only non-duplicate rows
      }

      let successCount = 0;
      const errors: string[] = [];

      // Import non-duplicate rows
      for (const { row, index: i } of rowsToImport) {
        const [isValid, validationError] = validateVendor(row);

        if (!isValid) {
          errors.push(`Row ${i + 2}: ${validationError}`);
          continue;
        }

        try {
          // Build vendor object - explicitly provide all fields
          const vendorData = {
            name: row.name.trim(),
            status: (row.status?.trim() || 'pending') as VendorInsert['status'],
            email: row.email?.trim() || null,
            phone: row.phone?.trim() || null,
            category: (row.category?.trim() || null) as VendorInsert['category'],
            website: row.website?.trim() || null,
            instagram_handle: row.instagram_handle?.trim() || null,
            facebook_handle: row.facebook_handle?.trim() || null,
            tiktok_handle: row.tiktok_handle?.trim() || null,
            description: row.description?.trim() || null,
            logo_url: row.logo_url?.trim() || null,
            owner_photo_url: row.owner_photo_url?.trim() || null,
            featured_photo_url: row.featured_photo_url?.trim() || null,
            user_id: null,
            map_position: null,
            event_years: null,
          } as VendorInsert;

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
        failed: rowsToImport.length - successCount,
        errors: [
          ...(duplicates.length > 0 ? [`⊘ Skipped ${duplicates.length} duplicate(s)`] : []),
          ...errors.slice(0, 10),
        ],
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
        CSV columns: name, owner_name (optional), email, phone, category, website, instagram_handle, facebook_handle, tiktok_handle, description, logo_url, featured_photo_url, owner_photo_url (optional), status
      </p>
    </div>
  );
}
