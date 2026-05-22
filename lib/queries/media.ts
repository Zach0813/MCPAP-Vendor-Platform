import { createServerClient } from '@/lib/supabase/server';

export interface MediaItem {
  id: string;
  file_url: string;
  media_type: 'image' | 'video';
  title: string;
  description: string | null;
  category: string;
  featured: boolean;
  featured_order: number | null;
  created_at: string;
}

/**
 * Fetch featured media items for homepage carousel.
 * Ordered by featured_order (admins can reorder)
 */
export async function getFeaturedMedia(): Promise<MediaItem[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('featured', true)
    .order('featured_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch featured media:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all media in a specific category (e.g., 'gallery')
 */
export async function getMediaByCategory(category: string): Promise<MediaItem[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Failed to fetch media for category "${category}":`, error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all media items
 */
export async function getAllMedia(): Promise<MediaItem[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch all media:', error);
    return [];
  }

  return data || [];
}
