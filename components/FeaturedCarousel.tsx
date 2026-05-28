'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

/**
 * Local view-model — only the columns this carousel renders. Kept as a `type`
 * (not an interface) so it can satisfy `Record<string, unknown>` constraints
 * downstream if we ever swap to a typed insert/update here. See HANDOFF.md.
 */
type FocalPoint = { x: number; y: number; zoom?: number; videoTime?: number };
type PlatformFocalPoints = { desktop: FocalPoint; mobile: FocalPoint };

type CarouselItem = {
  id: string;
  file_url: string;
  media_type: 'image' | 'video';
  title: string;
  focal_point: FocalPoint | PlatformFocalPoints | null;
};

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * FeaturedCarousel — Full-screen background that cycles through featured media items
 *
 * Specs:
 * - 5 second display per item
 * - 2 second fade in/out with pan effect
 * - Auto-playing muted videos
 * - Fallback to off-white gradient if no featured items
 * - Positioned as absolute background behind hero content
 */

/**
 * Get appropriate focal point for current viewport
 * Handles both single focal point (legacy) and multi-platform format
 */
function getFocalPoint(
  focalPointData: CarouselItem['focal_point']
): FocalPoint | null {
  if (!focalPointData) return null;

  // Check if multi-platform format (has both 'desktop' and 'mobile' keys)
  if ('desktop' in focalPointData && 'mobile' in focalPointData) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? focalPointData.mobile : focalPointData.desktop;
  }

  // Legacy single focal point format
  return focalPointData as FocalPoint;
}

export function FeaturedCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'hold' | 'out'>('in');
  const [isLoading, setIsLoading] = useState(true);
  const [panDirection, setPanDirection] = useState({ x: -3, y: 3 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Fetch featured media items
  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('featured', true)
          .order('featured_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log(`[Carousel] Loaded ${data?.length || 0} featured items`);
        setItems(data || []);
      } catch (err) {
        console.error('[Carousel] Failed to fetch featured media items:', err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  // Main carousel cycling logic: Continuous loop with fade states
  useEffect(() => {
    if (items.length === 0) return;

    const runCycle = (index: number) => {
      // Clear any pending timers from previous cycle
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];

      // Randomize pan direction for this cycle
      const directions = [
        { x: -3, y: 3 },
        { x: 3, y: -3 },
        { x: -3, y: -3 },
        { x: 3, y: 3 },
        { x: 0, y: -4 },
        { x: 0, y: 4 },
        { x: -4, y: 0 },
        { x: 4, y: 0 },
      ];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)]!;
      setPanDirection(randomDirection);

      const itemType = items[index]?.media_type || 'unknown';
      const itemTitle = items[index]?.title || 'unknown';
      console.log(`[Carousel] Starting cycle for item ${index} (${itemType}) - ${itemTitle}`);

      // Phase 0: Fade in (0-2s)
      setFadeState('in');
      console.log(`[Carousel] Phase 0: FADE_IN (0-2s) for item ${index}`);

      let timer1 = setTimeout(() => {
        // Phase 1: Hold (2-7s, 5 second duration)
        setFadeState('hold');
        console.log(`[Carousel] Phase 1: HOLD (2-7s) - item ${index}`);

        let timer2 = setTimeout(() => {
          // Phase 2: Fade out (7-9s, 2 second duration)
          setFadeState('out');
          console.log(`[Carousel] Phase 2: FADE_OUT (7-9s) - item ${index}`);

          let timer3 = setTimeout(() => {
            // Move to next item and restart cycle
            const nextIndex = (index + 1) % items.length;
            console.log(`[Carousel] Advancing: ${index} → ${nextIndex}`);
            setCurrentIndex(nextIndex);
          }, 2000);
          timersRef.current.push(timer3);
        }, 5000);
        timersRef.current.push(timer2);
      }, 2000);
      timersRef.current.push(timer1);
    };

    // Start the cycle immediately with current index
    console.log(`[Carousel] Initialized with ${items.length} items, starting at index ${currentIndex}`);
    runCycle(currentIndex);

    return () => {
      console.log(`[Carousel] Cleaning up timers (${timersRef.current.length} total)`);
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, [items.length, currentIndex]);

  // Handle video playback and track item changes
  useEffect(() => {
    const item = items[currentIndex];
    if (!item) return;

    console.log(`[Carousel] Displaying item ${currentIndex}: ${item.media_type} - ${item.title}`);

    // Reset video when switching items
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      console.log(`[Carousel] Reset video element`);
    }

    // Play new video if needed
    if (item.media_type === 'video' && videoRef.current) {
      console.log(`[Carousel] Playing video: ${item.title}`);
      // Ensure video plays when we switch to it
      videoRef.current.play().catch((err) => {
        console.warn(`[Carousel] Video autoplay blocked:`, err);
      });
    }
  }, [currentIndex, items]);

  if (isLoading || items.length === 0) {
    // Fallback: matches page background (sage-50)
    return (
      <div className="absolute inset-0 bg-sage-50" />
    );
  }

  const currentItem = items[currentIndex]!;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-sage-900"
    >
      {/* Video or Image Container with pan animation */}
      <div
        className={`absolute inset-0 transition-opacity duration-[2000ms] ${
          fadeState === 'in' ? 'opacity-0' : fadeState === 'hold' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          '--pan-end-x': `${panDirection.x}%`,
          '--pan-end-y': `${panDirection.y}%`,
          '--scale-start': '1.05',
          '--scale-end': `${getFocalPoint(currentItem.focal_point)?.zoom ?? 1.1}`,
        } as React.CSSProperties}
      >
        {currentItem.media_type === 'video' ? (
          <video
            key={`video-${currentItem.id}`}
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            loop
            className={`h-full w-full object-cover ${fadeState !== 'out' ? 'animate-pan' : 'animate-pan-hold'}`}
            style={{
              objectPosition: getFocalPoint(currentItem.focal_point)
                ? `${getFocalPoint(currentItem.focal_point)?.x}% ${getFocalPoint(currentItem.focal_point)?.y}%`
                : '50% 50%',
            }}
          >
            {/* Try WebM first (smaller), then fall back to original */}
            <source src={currentItem.file_url.replace(/\.(mp4|mov|m4v)$/i, '.webm')} type="video/webm" />
            <source src={currentItem.file_url} type="video/mp4" />
          </video>
        ) : (
          <img
            key={`img-${currentItem.id}`}
            src={currentItem.file_url}
            alt={currentItem.title}
            className={`h-full w-full object-cover ${fadeState !== 'out' ? 'animate-pan' : 'animate-pan-hold'}`}
            style={{
              objectPosition: getFocalPoint(currentItem.focal_point)
                ? `${getFocalPoint(currentItem.focal_point)?.x}% ${getFocalPoint(currentItem.focal_point)?.y}%`
                : '50% 50%',
            }}
          />
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pan {
          from {
            transform: scale(var(--scale-start)) translate(0, 0);
          }
          to {
            transform: scale(var(--scale-end)) translate(var(--pan-end-x), var(--pan-end-y));
          }
        }

        .animate-pan {
          animation: pan 7s ease-out forwards;
        }

        .animate-pan-hold {
          transform: scale(var(--scale-end)) translate(var(--pan-end-x), var(--pan-end-y));
        }
      `}</style>
    </div>
  );
}
