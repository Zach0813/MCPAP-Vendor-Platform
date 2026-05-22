import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { MediaManager } from '@/components/admin/MediaManager';

/**
 * Admin media management page
 * Allows admins to upload, organize, and feature images/videos
 * Featured items appear in homepage carousel
 */
export default async function MediaPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user)) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-sage-900">Media Library</h1>
        <p className="text-muted mt-1">
          Upload and manage images and videos. Featured items appear in the homepage carousel.
        </p>
      </div>

      <MediaManager />
    </div>
  );
}
