import { createServerClient } from '@/lib/supabase/server';
import type { MediaItem } from '@/types';

/**
 * Public-gallery row — the subset of MediaItem fields the masonry grid renders.
 * Kept as a narrowed type so the SELECT projection and TS shape stay in lockstep.
 */
export type MediaGalleryItem = Pick<
  MediaItem,
  'id' | 'file_url' | 'media_type' | 'title' | 'description' | 'featured' | 'created_at'
>;

export async function getApprovedGallery(): Promise<MediaGalleryItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('media')
    .select('id, file_url, media_type, title, description, featured, created_at')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getApprovedGallery:', error);
    return [];
  }
  return (data ?? []) as MediaGalleryItem[];
}
