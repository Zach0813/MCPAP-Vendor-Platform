'use client';

import { useState } from 'react';
import Image from 'next/image';
import { OptimizedVideo } from '@/components/video/OptimizedVideo';
import type { MediaGalleryItem } from '@/lib/data/gallery';

/**
 * Video gallery item with smart autoplay — plays only when visible in viewport
 * Uses OptimizedVideo for lazy loading, multiple codecs, and intelligent buffering
 */
function VideoGalleryItem({ item }: { item: MediaGalleryItem }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate poster from the video thumbnail (first frame at 0s)
  // If you have explicit poster images, use item.poster_url instead
  const posterUrl = item.file_url.replace(/\.(mp4|webm|mov|m4v)$/i, '_poster.jpg');

  return (
    <div className="relative bg-black/10">
      <OptimizedVideo
        src={item.file_url}
        poster={posterUrl}
        alt={item.title ?? 'Gallery video'}
        loop
        muted
        playsInline
        preload="metadata"
        className="h-auto w-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {/* Custom play/pause button overlay */}
      <button
        onClick={(e) => {
          e.preventDefault();
          const video = e.currentTarget.previousElementSibling as HTMLVideoElement;
          if (video?.paused) {
            video.play().catch(() => {
              // Autoplay may be blocked, that's ok
            });
          } else {
            video?.pause();
          }
        }}
        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20"
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      >
        {isPlaying ? (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
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
    <div className="columns-2 gap-4 sm:columns-2 lg:columns-3">
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
