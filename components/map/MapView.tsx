'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STYLE, buildMapView, isMapboxConfigured } from '@/lib/mapbox';
import type { Vendor, VendorCategory, EventMapConfig } from '@/types';
import { VENDOR_CATEGORY } from '@/types';
import { VendorPanel } from './VendorPanel';
import { CategoryFilter } from './CategoryFilter';
import { cn } from '@/lib/utils';

interface MapViewProps {
  vendors: Vendor[];
  eventMapConfig?: EventMapConfig | null;
}

/**
 * Interactive Mapbox view with vendor pins.
 * - Desktop: vendor detail renders in a right-side sidebar.
 * - Mobile (<sm): vendor detail slides up as a bottom sheet.
 * - Map center/zoom can be overridden per-event via eventMapConfig.
 */
export function MapView({ vendors, eventMapConfig }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all'>('all');
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');

  const filteredVendors = useMemo(
    () => (activeCategory === 'all' ? vendors : vendors.filter((v) => v.category === activeCategory)),
    [vendors, activeCategory]
  );

  // Initialize the map once.
  useEffect(() => {
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [eventMapConfig]);

  // Re-render markers when filtered list changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Tear down old markers.
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const vendor of filteredVendors) {
      const pos = vendor.map_position as { lng?: number; lat?: number } | null;
      if (!pos || typeof pos.lng !== 'number' || typeof pos.lat !== 'number') continue;

      const el = document.createElement('button');
      el.className =
        'flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-cream-50 shadow-card transition hover:scale-110 hover:bg-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-300';
      el.setAttribute('aria-label', `Vendor: ${vendor.name}`);
      el.textContent = '🌿';
      el.onclick = () => setSelectedVendor(vendor);

      const marker = new mapboxgl.Marker({ element: el }).setLngLat([pos.lng, pos.lat]).addTo(map);
      markersRef.current.push(marker);
    }
  }, [filteredVendors]);

  // Handle map style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (mapStyle === 'satellite') {
      // Add Google Maps satellite tiles
      if (!map.getSource('google-satellite')) {
        map.addSource('google-satellite', {
          type: 'raster',
          tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
          tileSize: 256,
          attribution: '© Google Maps',
        });
      }

      if (!map.getLayer('google-satellite-layer')) {
        map.addLayer({
          id: 'google-satellite-layer',
          type: 'raster',
          source: 'google-satellite',
          paint: {},
        });
      }

      // Add street labels on top of satellite
      if (!map.getSource('google-labels')) {
        map.addSource('google-labels', {
          type: 'raster',
          tiles: ['https://mt0.google.com/vt/lyrs=h&x={x}&y={y}&z={z}'],
          tileSize: 256,
          attribution: '© Google Maps',
        });
      }

      if (!map.getLayer('google-labels-layer')) {
        map.addLayer({
          id: 'google-labels-layer',
          type: 'raster',
          source: 'google-labels',
          paint: { 'raster-opacity': 0.7 },
        });
      }
    } else {
      // Remove satellite layers and restore street view
      if (map.getLayer('google-labels-layer')) {
        map.removeLayer('google-labels-layer');
      }
      if (map.getSource('google-labels')) {
        map.removeSource('google-labels');
      }
      if (map.getLayer('google-satellite-layer')) {
        map.removeLayer('google-satellite-layer');
      }
      if (map.getSource('google-satellite')) {
        map.removeSource('google-satellite');
      }
    }
  }, [mapStyle]);

  if (!isMapboxConfigured()) {
    return (
      <div className="flex h-full items-center justify-center bg-cream-50 p-8 text-center">
        <div className="max-w-md">
          <h2 className="font-display text-xl font-semibold text-sage-900">Map needs configuration</h2>
          <p className="mt-2 text-sm text-muted">
            Add a valid <code className="rounded bg-sage-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your
            <code className="rounded bg-sage-100 px-1">.env.local</code> file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full">
      <div className="absolute left-0 right-0 top-0 z-10 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <CategoryFilter
            value={activeCategory}
            onChange={setActiveCategory}
            categories={['all', ...VENDOR_CATEGORY]}
          />
          {/* Map style toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMapStyle('street')}
              className={cn(
                'rounded px-3 py-1 text-xs font-medium transition',
                mapStyle === 'street'
                  ? 'bg-sage-700 text-cream-50'
                  : 'border border-border bg-surface text-ink hover:bg-sage-50'
              )}
            >
              🗺️ Street
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={cn(
                'rounded px-3 py-1 text-xs font-medium transition',
                mapStyle === 'satellite'
                  ? 'bg-sage-700 text-cream-50'
                  : 'border border-border bg-surface text-ink hover:bg-sage-50'
              )}
            >
              🛰️ Satellite
            </button>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="h-full w-full" role="application" aria-label="Vendor map" />
      <VendorPanel vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
    </div>
  );
}
