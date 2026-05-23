"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN, MAPBOX_STYLE, buildMapView, isMapboxConfigured } from "@/lib/mapbox";
import type { Event, EventContactInfo, EventTimes, PinLocation } from "@/types";
import { cn } from "@/lib/utils";

interface EventEditorProps {
  event: Event;
}

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * Collapsible section component for info blocks
 */
function CollapsibleSection({ title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-sage-50 transition"
      >
        <h3 className="text-sm font-semibold text-sage-900">{title}</h3>
        <span className={cn("text-lg transition-transform", isOpen ? "rotate-180" : "")}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Improved event editor with collapsible sections and optimized layout:
 * - Map on the left side
 * - Info blocks on the right side (independently collapsible)
 * - Better input styling with proper focus states
 */
export function EventEditor({ event }: EventEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pinMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    address: true,
    dates: true,
    contact: false,
    social: false,
    hours: true,
  });

  // Form state
  const [eventName, setEventName] = useState(event.name);
  const [eventAddress, setEventAddress] = useState(event.address || event.location || "");
  const [dateStart, setDateStart] = useState(event.date_start);
  const [dateEnd, setDateEnd] = useState(event.date_end);

  // Pin location state
  const [pinLocation, setPinLocation] = useState<PinLocation>(
    event.pin_location || { lat: 33.5186, lng: -86.8104 } // Default to Birmingham, AL
  );

  // Map state
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">(
    (event.map_config?.styleUrl as any) === "google-satellite" ||
    (event.map_config?.styleUrl as any) === "mapbox://styles/mapbox/satellite-v9"
      ? "satellite"
      : "street"
  );
  const [showSatelliteLabels, setShowSatelliteLabels] = useState(true);

  // Event times state (format: { "2026-05-24": { start: "09:00", end: "17:00" } })
  const [eventTimes, setEventTimes] = useState<EventTimes>(event.event_times || {});

  // Contact info state
  const [contactInfo, setContactInfo] = useState<EventContactInfo>(event.contact_info || {});

  // Geocoding state
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; center: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isInitialMountRef = useRef(true);
  const shouldFlyToRef = useRef(false);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Generate date range for event times inputs
  const getEventDateRange = (): string[] => {
    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    const dates: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0]!;
      dates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // Initialize map
  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current || !isMapboxConfigured()) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const styleUrlMap: Record<string, string> = {
      street: MAPBOX_STYLE,
      satellite: "mapbox://styles/mapbox/satellite-v9",
    };

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrlMap[mapStyle],
      center: [pinLocation.lng, pinLocation.lat],
      zoom: 14,
      pitch: 0,
      bearing: 0,
    });

    // Setup satellite view if selected
    map.on("load", () => {
      if (mapStyle === "satellite") {
        const layers = map.getStyle().layers || [];
        layers.forEach((layer) => {
          if (layer.type === "raster") {
            map.removeLayer(layer.id);
          }
        });

        const sources = map.getStyle().sources || {};
        Object.keys(sources).forEach((sourceId) => {
          if (sources[sourceId as keyof typeof sources]?.type === "raster") {
            try {
              map.removeSource(sourceId);
            } catch (e) {
              // Source might not exist, ignore
            }
          }
        });

        // Add Google Maps satellite tiles
        map.addSource("google-satellite", {
          type: "raster",
          tiles: ["https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
          tileSize: 256,
          attribution: "© Google Maps",
        });

        map.addLayer({
          id: "google-satellite-layer",
          type: "raster",
          source: "google-satellite",
          paint: {},
        });

        if (showSatelliteLabels) {
          map.addSource("google-labels", {
            type: "raster",
            tiles: ["https://mt0.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"],
            tileSize: 256,
            attribution: "© Google Maps",
          });
          map.addLayer({
            id: "google-labels-layer",
            type: "raster",
            source: "google-labels",
            paint: { "raster-opacity": 0.7 },
          });
        }
      }
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    // Create draggable pin marker
    const el = document.createElement("div");
    el.className = "flex h-10 w-10 items-center justify-center rounded-full bg-sage-600 text-cream-50 shadow-lg text-lg";
    el.textContent = "📍";
    el.style.cursor = "move";

    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([pinLocation.lng, pinLocation.lat])
      .addTo(map);

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      setPinLocation({ lat: lngLat.lat, lng: lngLat.lng });
    });

    pinMarkerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle]);

  useEffect(() => initMap(), [initMap]);

  // Update marker position and optionally center map when pin location changes
  useEffect(() => {
    if (pinMarkerRef.current) {
      pinMarkerRef.current.setLngLat([pinLocation.lng, pinLocation.lat]);
    }
    // Only center map if this location change came from geocoding (not from dragging)
    if (mapRef.current && shouldFlyToRef.current) {
      mapRef.current.flyTo({
        center: [pinLocation.lng, pinLocation.lat],
        zoom: 14,
        duration: 1000,
      });
      shouldFlyToRef.current = false; // Reset the flag
    }
  }, [pinLocation]);

  // Satellite labels toggle
  useEffect(() => {
    if (!mapRef.current || mapStyle !== "satellite") return;

    const map = mapRef.current;
    const labelsLayerId = "google-labels-layer";
    const labelsSourceId = "google-labels";

    const toggleLabels = () => {
      // Add labels source and layer if they don't exist
      if (!map.getSource(labelsSourceId)) {
        map.addSource(labelsSourceId, {
          type: "raster",
          tiles: ["https://mt0.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"],
          tileSize: 256,
          attribution: "© Google Maps",
        });
      }
      if (!map.getLayer(labelsLayerId)) {
        map.addLayer({
          id: labelsLayerId,
          type: "raster",
          source: labelsSourceId,
          paint: { "raster-opacity": 0.7 },
        });
      }

      // Toggle visibility instead of removing/adding
      map.setLayoutProperty(labelsLayerId, "visibility", showSatelliteLabels ? "visible" : "none");
    };

    if (map.isStyleLoaded()) {
      toggleLabels();
    } else {
      map.once("load", toggleLabels);
    }
  }, [showSatelliteLabels, mapStyle]);

  // Geocoding
  useEffect(() => {
    // Skip geocoding on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (!eventAddress.trim() || eventAddress.length < 3) {
      setSuggestions([]);
      setGeocodeError("");
      return;
    }

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setIsGeocoding(true);
    setGeocodeError("");

    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(eventAddress)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
        );

        if (!response.ok) {
          throw new Error("Geocoding request failed");
        }

        const data = await response.json();
        if (!data.features || data.features.length === 0) {
          setSuggestions([]);
          setGeocodeError("No locations found. Try a different search.");
          setIsGeocoding(false);
          return;
        }

        const results = data.features.map((feature: any) => ({
          id: feature.id,
          name: feature.place_name,
          center: feature.center as [number, number],
        }));

        setSuggestions(results);
        // Don't automatically show suggestions - wait for user to interact
        setGeocodeError("");
      } catch (err) {
        console.error("Geocoding error:", err);
        setGeocodeError(err instanceof Error ? err.message : "Failed to search addresses");
        setSuggestions([]);
      } finally {
        setIsGeocoding(false);
      }
    }, 400);

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [eventAddress]);

  const handleSelectSuggestion = (suggestion: { name: string; center: [number, number] }) => {
    setEventAddress(suggestion.name);
    shouldFlyToRef.current = true; // Flag that we should fly to this location
    setPinLocation({ lat: suggestion.center[1], lng: suggestion.center[0] });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setSaveMessage("");

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventName,
          address: eventAddress,
          location: eventAddress, // Keep location in sync for backward compatibility
          date_start: dateStart,
          date_end: dateEnd,
          pin_location: pinLocation,
          event_times: eventTimes,
          contact_info: contactInfo,
          map_config: {
            center: [pinLocation.lng, pinLocation.lat],
            zoom: 14,
            styleUrl: mapStyle === "satellite" ? "google-satellite" : MAPBOX_STYLE,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save event");
      }

      setSaveStatus("success");
      setSaveMessage("✓ Event configuration saved!");
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMapboxConfigured()) {
    return (
      <div className="flex h-96 items-center justify-center rounded-card border border-sage-300 bg-sage-50">
        <p className="text-sage-700">Map editor unavailable: Mapbox token not configured</p>
      </div>
    );
  }

  const eventDates = getEventDateRange();

  return (
    <div className="space-y-6">
      {/* Main layout: Map on left, Info blocks on right */}
      <div className="grid grid-cols-2 gap-6">
        {/* LEFT COLUMN: Map */}
        <div>
          <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden flex flex-col sticky top-6" style={{ height: "calc(100vh - 300px)", maxHeight: "700px" }}>
            {/* Map */}
            <div ref={containerRef} className="flex-1 w-full" role="application" aria-label="Event location map" />

            {/* Satellite labels toggle */}
            {mapStyle === "satellite" && (
              <div className="px-3 py-2 border-t border-border flex items-center gap-2">
                <input
                  type="checkbox"
                  id="satellite-labels"
                  checked={showSatelliteLabels}
                  onChange={(e) => setShowSatelliteLabels(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="satellite-labels" className="text-xs font-medium text-ink">
                  Show street labels
                </label>
              </div>
            )}

            {/* Map View Toggle */}
            <div className="flex gap-2 p-3 border-t border-border">
              <button
                onClick={() => setMapStyle("street")}
                className={cn(
                  "flex-1 rounded px-2 py-1 text-xs font-medium transition",
                  mapStyle === "street"
                    ? "bg-sage-700 text-cream-50"
                    : "border border-border bg-surface text-ink hover:bg-sage-50"
                )}
              >
                🗺️ Street
              </button>
              <button
                onClick={() => setMapStyle("satellite")}
                className={cn(
                  "flex-1 rounded px-2 py-1 text-xs font-medium transition",
                  mapStyle === "satellite"
                    ? "bg-sage-700 text-cream-50"
                    : "border border-border bg-surface text-ink hover:bg-sage-50"
                )}
              >
                🛰️ Satellite
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Collapsible Info Blocks */}
        <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {/* Basic Info Section */}
          <CollapsibleSection
            title="Event Name"
            isOpen={expandedSections.basicInfo}
            onToggle={() => toggleSection("basicInfo")}
          >
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
              suppressHydrationWarning
            />
          </CollapsibleSection>

          {/* Address Section */}
          <CollapsibleSection
            title="Event Address"
            isOpen={expandedSections.address}
            onToggle={() => toggleSection("address")}
          >
            <div className="space-y-3">
              <div className="relative">
                <label className="block text-xs font-medium text-ink mb-1">
                  Address
                  {isGeocoding && <span className="text-xs text-sage-600 ml-2">searching...</span>}
                </label>
                <input
                  type="text"
                  value={eventAddress}
                  onChange={(e) => {
                    setEventAddress(e.target.value);
                    setShowSuggestions(true); // Show suggestions when user types
                  }}
                  onFocus={() => {
                    // Only show suggestions if they exist and user hasn't just focused an unchanged field
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Start typing address..."
                  className={cn(
                    "w-full rounded border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition",
                    geocodeError ? "border-terracotta-300 bg-terracotta-50" : "border-border bg-surface"
                  )}
                  suppressHydrationWarning
                />

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-surface border border-border rounded shadow-lg max-h-48 overflow-y-auto"
                  >
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-sage-50 text-xs text-ink border-b border-border last:border-b-0 transition"
                        type="button"
                      >
                        {suggestion.name}
                      </button>
                    ))}
                  </div>
                )}

                {geocodeError && <p className="text-xs text-terracotta-700 mt-1">{geocodeError}</p>}
              </div>

              {/* Coordinates display */}
              <div className="text-xs text-sage-600 bg-sage-50 rounded p-2 font-mono">
                📍 {pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)}
              </div>
            </div>
          </CollapsibleSection>

          {/* Dates Section */}
          <CollapsibleSection
            title="Event Dates"
            isOpen={expandedSections.dates}
            onToggle={() => toggleSection("dates")}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full rounded border border-border px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">End Date</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full rounded border border-border px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Contact Info Section */}
          <CollapsibleSection
            title="Contact Information"
            isOpen={expandedSections.contact}
            onToggle={() => toggleSection("contact")}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Phone</label>
                <input
                  type="tel"
                  value={contactInfo.phone || ""}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded border border-border px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Email</label>
                <input
                  type="email"
                  value={contactInfo.email || ""}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="info@example.com"
                  className="w-full rounded border border-border px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Website</label>
                <input
                  type="url"
                  value={contactInfo.website || ""}
                  onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full rounded border border-border px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Social Links Section */}
          <CollapsibleSection
            title="Social Links"
            isOpen={expandedSections.social}
            onToggle={() => toggleSection("social")}
          >
            <div className="space-y-3">
              {["instagram", "facebook", "tiktok"].map((platform) => (
                <div key={platform}>
                  <label className="block text-xs font-medium text-ink mb-1 capitalize">{platform}</label>
                  <input
                    type="text"
                    value={contactInfo[platform as keyof EventContactInfo] || ""}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, [platform]: e.target.value })
                    }
                    placeholder={`@username`}
                    className="w-full rounded border border-border px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Event Hours Section */}
          <CollapsibleSection
            title="Event Hours"
            isOpen={expandedSections.hours}
            onToggle={() => toggleSection("hours")}
          >
            <div className="space-y-3">
              {eventDates.map((date) => {
                const dateObj = new Date(date);
                const dateLabel = dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const time = eventTimes[date] || { start: "09:00", end: "17:00" };

                return (
                  <div key={date} className="pb-3 border-b border-border last:border-b-0">
                    <p className="text-xs font-medium text-sage-900 mb-2">{dateLabel}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted w-12 flex-shrink-0">Opens</label>
                        <input
                          type="time"
                          value={time.start}
                          onChange={(e) => {
                            setEventTimes({
                              ...eventTimes,
                              [date]: { ...time, start: e.target.value },
                            });
                          }}
                          className="flex-1 rounded border border-border px-2 py-1 text-xs text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
                          suppressHydrationWarning
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted w-12 flex-shrink-0">Closes</label>
                        <input
                          type="time"
                          value={time.end}
                          onChange={(e) => {
                            setEventTimes({
                              ...eventTimes,
                              [date]: { ...time, end: e.target.value },
                            });
                          }}
                          className="flex-1 rounded border border-border px-2 py-1 text-xs text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition"
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Spacing for scrollable area */}
          <div className="h-20" />
        </div>
      </div>

      {/* Save button - Sticky bottom right */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end z-40">
        {saveStatus === "success" && (
          <div className="rounded-card border border-sage-300 bg-sage-50 px-4 py-3 text-sm text-sage-800 shadow-card">
            ✓ {saveMessage}
          </div>
        )}
        {saveStatus === "error" && (
          <div className="rounded-card border border-terracotta-300 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-800 shadow-card">
            ✗ {saveMessage}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "px-6 py-3 font-medium text-cream-50 rounded-card transition shadow-card",
            isSaving ? "bg-sage-500 cursor-not-allowed" : "bg-sage-700 hover:bg-sage-800"
          )}
        >
          {isSaving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
