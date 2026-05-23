/**
 * Mapbox configuration helpers.
 *
 * The actual Mapbox GL JS import happens inside the client component
 * (components/map/MapView.tsx) because mapbox-gl touches `window` on import.
 * This file just exposes typed config + the public token getter.
 */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

/**
 * Default map viewport — fallback if event config doesn't specify.
 * This is overridden by events.map_config (jsonb) when provided.
 * Billings, MT coordinates as the primary fallback.
 */
export const DEFAULT_VIEW = {
  longitude: -103.2317,
  latitude: 45.7833,
  zoom: 14,
  pitch: 0,
  bearing: 0,
} as const;

/**
 * Builds the actual map view by merging event-specific config
 * with sensible defaults. Accepts a partial config (and null/undefined) so
 * server pages can pass `event?.map_config` straight through without a guard.
 */
type MapViewConfig = {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  styleUrl?: string;
};

export function buildMapView(eventMapConfig?: MapViewConfig | null) {
  return {
    longitude: eventMapConfig?.center?.[0] ?? DEFAULT_VIEW.longitude,
    latitude: eventMapConfig?.center?.[1] ?? DEFAULT_VIEW.latitude,
    zoom: eventMapConfig?.zoom ?? DEFAULT_VIEW.zoom,
    pitch: eventMapConfig?.pitch ?? DEFAULT_VIEW.pitch,
    bearing: eventMapConfig?.bearing ?? DEFAULT_VIEW.bearing,
  };
}

export function isMapboxConfigured(): boolean {
  return MAPBOX_TOKEN.startsWith('pk.');
}
