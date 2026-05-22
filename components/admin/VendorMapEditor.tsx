'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STYLE, buildMapView, isMapboxConfigured } from '@/lib/mapbox';
import type { Vendor, EventMapConfig } from '@/types';
import { cn } from '@/lib/utils';

interface VendorMapEditorProps {
  vendors: Vendor[];
  eventMapConfig?: EventMapConfig | null;
  onVendorUpdate?: (vendorId: string, mapPosition: any) => Promise<void>;
}

/**
 * Interactive map for admins to position vendors.
 * Drag pins to set coordinates, input booth size.
 */
export function VendorMapEditor({ vendors, eventMapConfig, onVendorUpdate }: VendorMapEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const dragStateRef = useRef<{ vendorId: string; marker: mapboxgl.Marker } | null>(null);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [boothSize, setBoothSize] = useState({ length: 10, width: 10 });

  // Initialize map
  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current || !isMapboxConfigured()) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const view = buildMapView(eventMapConfig);
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: [view.longitude, view.latitude],
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    // Add vendors as draggable markers
    vendors.forEach((vendor) => {
      const pos = vendor.map_position as { lng?: number; lat?: number } | null;
      if (!pos || typeof pos.lng !== 'number' || typeof pos.lat !== 'number') return;

      const el = document.createElement('button');
      el.className = cn(
        'flex h-10 w-10 items-center justify-center rounded-full shadow-card transition',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-300',
        selectedVendor?.id === vendor.id
          ? 'bg-sage-600 text-cream-50 scale-125'
          : 'bg-sage-500 text-cream-50 hover:scale-110 hover:bg-sage-600'
      );
      el.setAttribute('aria-label', `${vendor.name} — drag to reposition`);
      el.textContent = '📍';
      el.draggable = true;

      // Marker drag handlers
      el.addEventListener('dragstart', (e) => {
        e.preventDefault(); // Browser drag, not mapbox
        dragStateRef.current = { vendorId: vendor.id, marker };
      });

      el.addEventListener('click', () => setSelectedVendor(vendor));

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat([pos.lng, pos.lat])
        .addTo(map);

      // On marker drag end
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setSelectedVendor((prev) =>
          prev?.id === vendor.id
            ? {
                ...prev,
                map_position: {
                  ...prev.map_position,
                  lng: Math.round(lngLat.lng * 10000) / 10000,
                  lat: Math.round(lngLat.lat * 10000) / 10000,
                } as any,
              }
            : prev
        );
      });

      markersRef.current.set(vendor.id, marker);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [vendors, eventMapConfig, selectedVendor?.id]);

  // Initialize on mount
  useEffect(initMap, [initMap]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!selectedVendor || !onVendorUpdate) return;

    setIsSaving(true);
    try {
      await onVendorUpdate(selectedVendor.id, {
        lng: selectedVendor.map_position?.lng || selectedVendor.map_position?.['lng'],
        lat: selectedVendor.map_position?.lat || selectedVendor.map_position?.['lat'],
        booth_size: {
          length: boothSize.length,
          width: boothSize.width,
        },
      });
      alert(`✓ ${selectedVendor.name} position saved!`);
    } catch (err) {
      alert(`✗ Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedVendor, boothSize, onVendorUpdate]);

  if (!isMapboxConfigured()) {
    return (
      <div className="flex h-96 items-center justify-center rounded-card border border-sage-300 bg-sage-50">
        <p className="text-sage-700">Map editor unavailable: Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {/* Map */}
      <div className="lg:col-span-3">
        <div className="rounded-card border border-border shadow-card overflow-hidden">
          <div ref={containerRef} className="h-96 lg:h-full min-h-96 w-full" role="application" aria-label="Vendor map editor" />
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4">
        {selectedVendor ? (
          <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <h3 className="font-display text-lg font-semibold text-sage-900 mb-3">
              {selectedVendor.name}
            </h3>

            <div className="space-y-3 text-sm mb-4">
              <div>
                <label className="block font-medium text-ink mb-1">Latitude</label>
                <input
                  type="number"
                  step={0.0001}
                  value={(selectedVendor.map_position as any)?.lat || ''}
                  onChange={(e) =>
                    setSelectedVendor((prev) =>
                      prev
                        ? {
                            ...prev,
                            map_position: {
                              ...(prev.map_position as any),
                              lat: parseFloat(e.target.value),
                            },
                          }
                        : null
                    )
                  }
                  className="w-full rounded border border-border px-2 py-1"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Longitude</label>
                <input
                  type="number"
                  step={0.0001}
                  value={(selectedVendor.map_position as any)?.lng || ''}
                  onChange={(e) =>
                    setSelectedVendor((prev) =>
                      prev
                        ? {
                            ...prev,
                            map_position: {
                              ...(prev.map_position as any),
                              lng: parseFloat(e.target.value),
                            },
                          }
                        : null
                    )
                  }
                  className="w-full rounded border border-border px-2 py-1"
                />
              </div>

              <div className="border-t border-border pt-3">
                <label className="block font-medium text-ink mb-1">Booth Length (feet)</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={boothSize.length}
                  onChange={(e) => setBoothSize((prev) => ({ ...prev, length: parseInt(e.target.value) }))}
                  className="w-full rounded border border-border px-2 py-1"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Booth Width (feet)</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={boothSize.width}
                  onChange={(e) => setBoothSize((prev) => ({ ...prev, width: parseInt(e.target.value) }))}
                  className="w-full rounded border border-border px-2 py-1"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-card bg-sage-700 px-4 py-2 font-medium text-cream-50 hover:bg-sage-800 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Position'}
            </button>
          </div>
        ) : (
          <div className="rounded-card border border-sage-300 bg-sage-50 p-4 text-sm text-sage-700">
            Click a vendor pin to edit its position.
          </div>
        )}
      </div>
    </div>
  );
}
