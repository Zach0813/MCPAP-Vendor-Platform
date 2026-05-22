'use client';

import { VendorMapEditor } from './VendorMapEditor';
import type { Vendor, EventMapConfig } from '@/types';

interface VendorMapEditorWrapperProps {
  vendors: Vendor[];
  eventMapConfig?: EventMapConfig | null;
}

/**
 * Client-side wrapper for VendorMapEditor that handles API calls.
 */
export function VendorMapEditorWrapper({ vendors, eventMapConfig }: VendorMapEditorWrapperProps) {
  const handleVendorUpdate = async (vendorId: string, mapPosition: any) => {
    const response = await fetch(`/api/vendors/${vendorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ map_position: mapPosition }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update vendor');
    }

    return response.json();
  };

  return (
    <VendorMapEditor
      vendors={vendors}
      eventMapConfig={eventMapConfig}
      onVendorUpdate={handleVendorUpdate}
    />
  );
}
