'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STYLE, isMapboxConfigured } from '@/lib/mapbox';
import type { Event } from '@/types';
import { cn } from '@/lib/utils';

interface EventLocationSectionProps {
  event: Event | null;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Strip leading 1 if present (country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  // Format as (XXX) XXX-XXXX for 10-digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Return original if not a standard US number
  return phone;
}

/**
 * Read-only event location map for the homepage.
 * Shows the event location with address info alongside.
 */
export function EventLocationSection({ event }: EventLocationSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');

  useEffect(() => {
    if (!containerRef.current || !event || mapRef.current || !isMapboxConfigured()) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Use pin location from event, fallback to Birmingham, AL coordinates
    const lat = event.pin_location?.lat ?? 33.5186;
    const lng = event.pin_location?.lng ?? -86.8104;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: [lng, lat],
      zoom: 14,
      pitch: 0,
      bearing: 0,
      interactive: true,
    });

    // Add marker at event location
    const el = document.createElement('div');
    el.className = 'w-10 h-10 rounded-full bg-sage-600 text-cream-50 flex items-center justify-center shadow-lg text-lg';
    el.innerHTML = '📍';

    new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);

    // Add navigation control
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [event]);

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

  if (!event || !isMapboxConfigured()) {
    return null;
  }

  return (
    <section className="bg-sage-50 py-16 dark:bg-sage-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50 mb-12">Event Location</h2>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Map */}
          <div className="rounded-card overflow-hidden shadow-card flex flex-col dark:shadow-lg">
            {/* Map style toggle */}
            <div className="flex gap-2 p-3 border-b border-border bg-surface dark:bg-sage-900 dark:border-sage-700">
              <button
                onClick={() => setMapStyle('street')}
                className={cn(
                  'flex-1 rounded px-2 py-1 text-xs font-medium transition',
                  mapStyle === 'street'
                    ? 'bg-sage-700 text-cream-50 dark:bg-sage-600'
                    : 'border border-border bg-surface text-ink hover:bg-sage-50 dark:border-sage-700 dark:bg-sage-800 dark:text-cream-50 dark:hover:bg-sage-700'
                )}
              >
                🗺️ Street
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={cn(
                  'flex-1 rounded px-2 py-1 text-xs font-medium transition',
                  mapStyle === 'satellite'
                    ? 'bg-sage-700 text-cream-50 dark:bg-sage-600'
                    : 'border border-border bg-surface text-ink hover:bg-sage-50 dark:border-sage-700 dark:bg-sage-800 dark:text-cream-50 dark:hover:bg-sage-700'
                )}
              >
                🛰️ Satellite
              </button>
            </div>
            <div ref={containerRef} className="w-full h-96" role="application" aria-label="Event location map" />
          </div>

          {/* Event Information */}
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl font-semibold text-sage-900 dark:text-cream-50">Visit Us</h3>
              <button
                onClick={() => {
                  const eventLat = event.pin_location?.lat ?? 33.5186;
                  const eventLng = event.pin_location?.lng ?? -86.8104;

                  // Request user's current location for directions
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;

                        // Construct directions URL
                        const isMobile = navigator.userAgent.match(/Android|iPhone|iPad|iPod/i);
                        const directionUrl = `https://maps.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${eventLat},${eventLng}`;

                        if (isMobile) {
                          // On mobile, use Google Maps app if available, otherwise web
                          const mobileUrl = `comgooglemaps://?saddr=${userLat},${userLng}&daddr=${eventLat},${eventLng}`;
                          window.location.href = mobileUrl;
                          // Fallback to web if app not available
                          setTimeout(() => {
                            window.open(directionUrl, '_blank');
                          }, 500);
                        } else {
                          // On desktop, use Google Maps web
                          window.open(directionUrl, '_blank');
                        }
                      },
                      () => {
                        // If geolocation fails, just open map at event location
                        const isMobile = navigator.userAgent.match(/Android|iPhone|iPad|iPod/i);
                        const mapUrl = `https://maps.google.com/?q=${eventLat},${eventLng}`;

                        if (isMobile) {
                          window.location.href = `geo:${eventLat},${eventLng}`;
                          setTimeout(() => {
                            window.open(mapUrl, '_blank');
                          }, 500);
                        } else {
                          window.open(mapUrl, '_blank');
                        }
                      }
                    );
                  }
                }}
                className="mt-2 text-lg text-sage-700 hover:text-sage-900 hover:underline transition cursor-pointer text-left dark:text-sage-300 dark:hover:text-cream-50"
              >
                {event.location}
              </button>
            </div>

            <div>
              <h4 className="font-medium text-sage-900 dark:text-cream-50 mb-2">Event Dates & Times</h4>
              <div className="space-y-2">
                {(() => {
                  const dates: string[] = [];
                  const start = new Date(event.date_start);
                  const end = new Date(event.date_end);
                  const current = new Date(start);

                  while (current <= end) {
                    const dateStr = current.toISOString().split('T')[0]!;
                    dates.push(dateStr);
                    current.setDate(current.getDate() + 1);
                  }

                  return dates.map((date) => {
                    const dateObj = new Date(date);
                    const dayOfWeek = dateObj.toLocaleDateString('en-US', {
                      weekday: 'long',
                    });
                    const dateLabel = dateObj.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const times = event.event_times?.[date] || { start: '09:00', end: '17:00' };

                    // Convert 24-hour time to 12-hour format
                    const formatTime = (time: string) => {
                      const [hours, minutes] = time.split(':') as [string, string];
                      const hour = parseInt(hours);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayHour = hour % 12 || 12;
                      return `${displayHour}:${minutes} ${ampm}`;
                    };

                    return (
                      <div key={date} className="text-sage-700 dark:text-sage-300">
                        <p className="font-medium">{dayOfWeek}, {dateLabel}</p>
                        <p className="text-sm text-sage-600 dark:text-sage-400">{formatTime(times.start)} – {formatTime(times.end)}</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {event.contact_info && (event.contact_info.phone || event.contact_info.email || event.contact_info.website) && (
              <div>
                <h4 className="font-medium text-sage-900 dark:text-cream-50 mb-4">Get in Touch</h4>
                <div className="space-y-3">
                  {event.contact_info.phone && (
                    <a
                      href={`tel:${event.contact_info.phone}`}
                      className="flex items-center gap-3 p-3 rounded-card border border-border hover:bg-sage-50 transition dark:border-sage-700 dark:bg-sage-900 dark:hover:bg-sage-800"
                    >
                      <span className="text-xl">📞</span>
                      <span className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50">{formatPhoneNumber(event.contact_info.phone)}</span>
                    </a>
                  )}
                  {event.contact_info.email && (
                    <a
                      href={`mailto:${event.contact_info.email}`}
                      className="flex items-center gap-3 p-3 rounded-card border border-border hover:bg-sage-50 transition dark:border-sage-700 dark:bg-sage-900 dark:hover:bg-sage-800"
                    >
                      <span className="text-xl">📧</span>
                      <span className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50">{event.contact_info.email}</span>
                    </a>
                  )}
                  {event.contact_info.website && (
                    <a
                      href={event.contact_info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-card border border-border hover:bg-sage-50 transition dark:border-sage-700 dark:bg-sage-900 dark:hover:bg-sage-800"
                    >
                      <span className="text-xl">🔗</span>
                      <span className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50">Visit website</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
