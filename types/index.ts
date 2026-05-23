/**
 * Shared TypeScript types — Magic City Plant-A-Palooza
 *
 * Two layers here:
 *
 *  1. App-level types (Vendor, Event, etc.) — what the rest of the codebase imports.
 *  2. The Database type at the bottom — what @supabase/supabase-js uses to type
 *     query results and inserts. It mirrors the SQL schema exactly. When you
 *     change a migration, update both halves.
 */

// -----------------------------------------------------------------------------
// Enums (match the SQL CREATE TYPE statements in supabase/migrations/0001_*.sql)
// -----------------------------------------------------------------------------

export const VENDOR_STATUS = ['pending', 'approved', 'rejected', 'suspended'] as const;
export type VendorStatus = (typeof VENDOR_STATUS)[number];

export const APPLICATION_STATUS = ['pending', 'approved', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

export const REQUEST_TYPE = ['participation', 'cancellation', 'change'] as const;
export type RequestType = (typeof REQUEST_TYPE)[number];

export const REQUEST_STATUS = ['pending', 'approved', 'rejected'] as const;
export type RequestStatus = (typeof REQUEST_STATUS)[number];

export const UPLOADER_TYPE = ['guest', 'vendor'] as const;
export type UploaderType = (typeof UPLOADER_TYPE)[number];

export const VENDOR_CATEGORY = [
  'plants',
  'pots-decor',
  'art',
  'food',
  'apparel',
  'workshop',
  'other',
] as const;
export type VendorCategory = (typeof VENDOR_CATEGORY)[number];

// -----------------------------------------------------------------------------
// JSONB shapes
// -----------------------------------------------------------------------------

/**
 * vendors.map_position — either geographic coordinates (preferred) or a booth
 * number for vendors who don’t need a precise map pin.
 * Optionally includes booth_size for map visualization.
 */
export type MapPosition =
  | { lng: number; lat: number; booth?: string; booth_size?: { length: number; width: number } }
  | { booth: string; lng?: never; lat?: never };

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
};

/**
 * events.map_config — Mapbox view overrides for this specific event.
 */
export type EventMapConfig = {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  bearing?: number;
  pitch?: number;
  styleUrl?: string;
};

/**
 * events.pin_location — Precise coordinates for the event location marker.
 */
export type PinLocation = {
  lat: number;
  lng: number;
};

/**
 * events.event_times — Hours of operation for each day of the event.
 */
export type EventTimes = {
  [date: string]: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
};

/**
 * events.contact_info — Contact details and social links for the event.
 */
export type EventContactInfo = {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  notes?: string; // Special instructions or info for attendees
};

// -----------------------------------------------------------------------------
// App-level row types — what your components and pages should import.
// -----------------------------------------------------------------------------

export type Vendor = {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  category: VendorCategory | null;
  logo_url: string | null;
  owner_photo_url: string | null;
  featured_photo_url: string | null;
  website: string | null;
  instagram_handle: string | null;
  facebook_handle: string | null;
  tiktok_handle: string | null;
  email: string | null;
  phone: string | null;
  status: VendorStatus;
  user_id: string | null;
  map_position: MapPosition | null;
  event_years: number[] | null;
}

export type Event = {
  id: string;
  year: number;
  name: string;
  date_start: string; // ISO date (YYYY-MM-DD)
  date_end: string;
  location: string;
  description: string | null;
  address: string | null;
  pin_location: PinLocation | null;
  event_times: EventTimes | null;
  contact_info: EventContactInfo | null;
  map_config: EventMapConfig | null;
}

export type VendorApplication = {
  id: string;
  created_at: string;
  vendor_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  business_description: string;
  category: VendorCategory;
  website: string | null;
  social_links: SocialLinks;
  logo_url: string | null;
  owner_photo_url: string | null;
  featured_photo_url: string | null;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

export type EventRequest = {
  id: string;
  created_at: string;
  vendor_id: string;
  event_id: string;
  type: RequestType;
  message: string | null;
  status: RequestStatus;
  reviewed_at: string | null;
}

export type GalleryItem = {
  id: string;
  created_at: string;
  storage_path: string;
  uploader_type: UploaderType;
  vendor_id: string | null;
  event_id: string | null;
  caption: string | null;
  consent_given: boolean;
  approved: boolean;
  featured: boolean;
  focal_point: { x: number; y: number } | null;
}

/**
 * media — admin-managed image/video library. Powers the homepage carousel
 * (featured=true rows) and the public gallery. See migration 0009 + 0011 + 0012.
 *
 * focal_point JSONB carries optional zoom (1–3) and videoTime (seconds) for
 * the carousel pan/Ken-Burns effect. Migration 0012 added those keys; older
 * rows may still have just { x, y }.
 */
export type MediaItem = {
  id: string;
  file_url: string;
  media_type: 'image' | 'video';
  title: string;
  description: string | null;
  category: string;
  featured: boolean;
  featured_order: number | null;
  focal_point: { x: number; y: number; zoom?: number; videoTime?: number } | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Supabase Database type — passed to the typed client as
//   createClient<Database>(url, key)
// so that .from('vendors').select() returns the correct row shape.
// -----------------------------------------------------------------------------

export type Database = {
  // Required by @supabase/supabase-js ≥ 2.55 — keep this even if it looks weird.
  // The typegen output (`supabase gen types typescript`) includes it automatically.
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      vendors: {
        Row: Vendor;
        Insert: Omit<Vendor, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Vendor, 'id'>>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'address' | 'pin_location' | 'event_times' | 'contact_info'> & {
          id?: string;
          address?: string | null;
          pin_location?: PinLocation | null;
          event_times?: EventTimes | null;
          contact_info?: EventContactInfo | null;
        };
        Update: Partial<Omit<Event, 'id'>>;
        Relationships: [];
      };
      vendor_applications: {
        Row: VendorApplication;
        Insert: Omit<VendorApplication, 'id' | 'created_at' | 'reviewed_by' | 'reviewed_at' | 'notes'> & {
          id?: string;
          created_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<Omit<VendorApplication, 'id'>>;
        Relationships: [];
      };
      event_requests: {
        Row: EventRequest;
        // Insert: only vendor_id, event_id, type are required. The rest have DB defaults
        // or are nullable, so they're optional from the caller's perspective.
        Insert: Omit<EventRequest, 'id' | 'created_at' | 'reviewed_at' | 'status' | 'message'> & {
          id?: string;
          created_at?: string;
          reviewed_at?: string | null;
          status?: RequestStatus;
          message?: string | null;
        };
        Update: Partial<Omit<EventRequest, 'id'>>;
        // Two real foreign keys: event_requests.vendor_id → vendors.id, event_requests.event_id → events.id.
        // The empty array is fine for now — joins like `.select('*, events(year,name)')` work
        // at runtime regardless; this only affects the typed join shape.
        Relationships: [];
      };
      gallery: {
        Row: GalleryItem;
        // Insert: storage_path, uploader_type, consent_given are required. Everything
        // else is either DB-defaulted (approved, featured) or nullable (vendor_id,
        // event_id, caption, focal_point) and therefore optional at the call site.
        Insert: Omit<
          GalleryItem,
          'id' | 'created_at' | 'approved' | 'featured' | 'vendor_id' | 'event_id' | 'caption' | 'focal_point'
        > & {
          id?: string;
          created_at?: string;
          approved?: boolean;
          featured?: boolean;
          vendor_id?: string | null;
          event_id?: string | null;
          caption?: string | null;
          focal_point?: { x: number; y: number } | null;
        };
        Update: Partial<Omit<GalleryItem, 'id'>>;
        Relationships: [];
      };
      media: {
        Row: MediaItem;
        // Insert: file_url, media_type, title are required. Everything else is either
        // DB-defaulted (category='general', featured=false, focal_point={x:50,y:50,...},
        // created_at, updated_at) or nullable (description, featured_order, created_by).
        Insert: Omit<
          MediaItem,
          'id' | 'created_at' | 'updated_at' | 'description' | 'category' | 'featured' | 'featured_order' | 'focal_point' | 'created_by'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          description?: string | null;
          category?: string;
          featured?: boolean;
          featured_order?: number | null;
          focal_point?: { x: number; y: number; zoom?: number; videoTime?: number } | null;
          created_by?: string | null;
        };
        Update: Partial<Omit<MediaItem, 'id'>>;
        Relationships: [];
      };
    };
    Enums: {
      vendor_status: VendorStatus;
      application_status: ApplicationStatus;
      request_type: RequestType;
      request_status: RequestStatus;
      uploader_type: UploaderType;
      vendor_category: VendorCategory;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
