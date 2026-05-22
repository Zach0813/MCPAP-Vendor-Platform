/**
 * Client-safe gallery URL helper (no server-only imports).
 */
export function getGalleryPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return '';
  return `${base}/storage/v1/object/public/gallery/${storagePath}`;
}
