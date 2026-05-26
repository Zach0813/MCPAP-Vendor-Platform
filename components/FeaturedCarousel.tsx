'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

/**
 * Local view-model — only the columns this carousel renders. Kept as a `type`
 * (not an interface) so it can satisfy `Record<string, unknown>` constraints
 * downstream if we ever swap to a typed insert/update here. See HANDOFF.md.
 */
type CarouselItem = {
  id: string;
  file_url: string;
  media_type: 'image' | 'video';
  title: string;
  focal_point: { x: number; y: number; zoom?: number; videoTime?: number } | null;
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
export function FeaturedCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'hold' | 'out'>('in');
  const [isLoading, setIsLoading] = useState(true);
  const [panDirection, setPanDirection] = useState({ x: -3, y: 3 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        setItems(data || []);
      } catch (err) {
        console.error('Failed to fetch featured media items:', err);
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

    let cyclePhase = 0; // 0: fade-in, 1: hold, 2: fade-out
    let phaseTimer: NodeJS.Timeout;

    const runCycle = () => {
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

      // Phase 0: Fade in (0-2s)
      setFadeState('in');
      cyclePhase = 0;

      phaseTimer = setTimeout(() => {
        // Phase 1: Hold (2-7s, 5 second duration)
        setFadeState('hold');
        cyclePhase = 1;

        phaseTimer = setTimeout(() => {
          // Phase 2: Fade out (7-9s, 2 second duration)
          setFadeState('out');
          cyclePhase = 2;

          phaseTimer = setTimeout(() => {
            // Move to next item and restart cycle
            setCurrentIndex((prev) => (prev + 1) % items.length);
            runCycle();
          }, 2000);
        }, 5000);
      }, 2000);
    };

    // Start the cycle immediately
    runCycle();

    return () => {
      clearTimeout(phaseTimer);
    };
  }, [items.length]);

  // Handle video playback
  useEffect(() => {
    const item = items[currentIndex]!;
    if (!item) return;

    if (item.media_type === 'video' && videoRef.current) {
      // Ensure video plays when we switch to it
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, that's ok
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
        } as React.CSSProperties}
      >
        {currentItem.media_type === 'video' ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            className={`h-full w-full object-cover ${fadeState !== 'out' ? 'animate-pan' : 'animate-pan-hold'}`}
            style={{
              objectPosition: currentItem.focal_point
                ? `${currentItem.focal_point.x}% ${currentItem.focal_point.y}%`
                : '50% 50%',
            }}
            onEnded={() => {
              setFadeState('out');
            }}
          >
            {/* Multiple codec formats for broad compatibility */}
            <source src={currentItem.file_url.replace(/\.(mp4|mov|m4v)$/i, '.webm')} type="video/webm; codecs=vp9,opus" />
            <source src={currentItem.file_url} type="video/mp4; codecs=h264,aac" />
          </video>
        ) : (
          <img
            src={currentItem.file_url}
            alt={currentItem.title}
            className={`h-full w-full object-cover ${fadeState !== 'out' ? 'animate-pan' : 'animate-pan-hold'}`}
            style={{
              objectPosition: currentItem.focal_point
                ? `${currentItem.focal_point.x}% ${currentItem.focal_point.y}%`
                : '50% 50%',
            }}
          />
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pan {
          from {
            transform: scale(1.05) translate(0, 0);
          }
          to {
            transform: scale(1.1) translate(var(--pan-end-x), var(--pan-end-y));
          }
        }

        .animate-pan {
          animation: pan 7s ease-out forwards;
        }

        .animate-pan-hold {
          transform: scale(1.1) translate(var(--pan-end-x), var(--pan-end-y));
        }
      `}</style>
    </div>
  );
}
