import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { MediaManager } from '@/components/admin/MediaManager';

/**
 * Admin gallery and media library — combined management page
 * Upload, organize, feature, and delete all media from one place
 */
export default async function AdminGalleryPage() {
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
        <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">Gallery & Media</h1>
        <p className="text-muted mt-1 dark:text-sage-300">
          Manage all your media in one place. Upload directly, set categories, and feature items for the carousel.
        </p>
      </div>

      <MediaManager />
    </div>
  );
}
