/**
 * Server-side data accessors for the vendors table.
 * Use these from Server Components — they go through RLS as the current user.
 */

import { createServerClient } from '@/lib/supabase/server';
import type { Vendor } from '@/types';

export async function getApprovedVendors(): Promise<Vendor[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('status', 'approved')
    .order('name', { ascending: true });

  if (error) {
    console.error('getApprovedVendors:', error);
    return [];
  }
  return (data ?? []) as Vendor[];
}

/**
 * Same as approved vendors, but only those with a valid map_position.
 * Filters out booth-number-only entries that can’t render on a geo map.
 */
export async function getApprovedVendorsForMap(): Promise<Vendor[]> {
  const all = await getApprovedVendors();
  return all.filter(
    (v) =>
      v.map_position &&
      typeof (v.map_position as { lng?: number }).lng === 'number' &&
      typeof (v.map_position as { lat?: number }).lat === 'number'
  );
}
