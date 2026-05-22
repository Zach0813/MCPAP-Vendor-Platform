import { createServerClient } from '@/lib/supabase/server';

export interface MediaGalleryItem {
  id: string;
  file_url: string;
  media_type: 'image' | 'video';
  title: string;
  description: string | null;
  featured: boolean;
  created_at: string;
}

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
