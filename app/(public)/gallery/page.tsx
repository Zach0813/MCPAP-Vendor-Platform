import type { Metadata } from 'next';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { UploadButton } from '@/components/gallery/UploadButton';
import { getApprovedGallery } from '@/lib/data/gallery';

export const metadata: Metadata = {
  title: 'Photo Gallery',
};

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const items = await getApprovedGallery();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">Photo Gallery</h1>
          <p className="mt-2 text-muted dark:text-sage-300">
            Memories from past events. Upload your own photos to be featured after a quick review in admin.
          </p>
        </div>
        <UploadButton />
      </header>
      <MasonryGrid items={items} />
    </div>
  );
}
