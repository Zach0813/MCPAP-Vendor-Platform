'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import type { MediaGalleryItem } from '@/lib/data/gallery';

/**
 * Video gallery item with smart autoplay — plays only when visible in viewport
 */
function VideoGalleryItem({ item }: { item: MediaGalleryItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay may be blocked, that's ok
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 } // Trigger when 50% of video is visible
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={item.file_url}
      controls
      loop
      muted
      className="h-auto w-full"
    />
  );
}

/**
 * CSS-only masonry layout using `columns`. No JS measuring required —
 * cheaper, faster, and degrades gracefully.
 * Displays media items from the unified media library.
 */
export function MasonryGrid({ items }: { items: MediaGalleryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-12 text-center text-muted">
        No photos yet. Be the first to upload one.
      </div>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {items.map((item) => (
        <figure
          key={item.id}
          className="mb-4 break-inside-avoid overflow-hidden rounded-card border border-border bg-surface shadow-card"
        >
          {item.media_type === 'image' ? (
            <Image
              src={item.file_url}
              alt={item.title ?? 'Magic City Plant-A-Palooza photo'}
              width={600}
              height={800}
              className="h-auto w-full"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <VideoGalleryItem item={item} />
          )}
          {item.description ? (
            <figcaption className="px-3 py-2 text-sm text-muted">{item.description}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
