'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface FocalPoint {
  x: number; // 0-100 (percentage)
  y: number; // 0-100 (percentage)
  zoom?: number; // zoom level (1-3)
  videoTime?: number; // current video timestamp in seconds
}

type PlatformFocalPoints = Record<Platform, FocalPoint>;

interface FocalPointEditorProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  currentFocalPoint: FocalPoint | PlatformFocalPoints | null;
  onFocalPointChange: (point: PlatformFocalPoints) => void;
}

type Platform = 'desktop' | 'mobile';

const PLATFORM_ASPECTS = {
  desktop: 16 / 9,
  mobile: 9 / 16,
};

/**
 * Focal point editor for images and videos
 * Shows viewport frame representing visible carousel area
 * Desktop/mobile preview toggle to set focal points independently per platform
 */
export function FocalPointEditor({
  mediaUrl,
  mediaType,
  currentFocalPoint,
  onFocalPointChange,
}: FocalPointEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect if currentFocalPoint is single or multi-platform format
  const isMultiPlatform = currentFocalPoint && 'desktop' in currentFocalPoint;

  const defaultDesktopPoint = isMultiPlatform
    ? (currentFocalPoint as PlatformFocalPoints).desktop
    : (currentFocalPoint as FocalPoint) || { x: 50, y: 50, zoom: 1.1, videoTime: 0 };

  const defaultMobilePoint = isMultiPlatform
    ? (currentFocalPoint as PlatformFocalPoints).mobile
    : { x: 50, y: 50, zoom: 1.15, videoTime: 0 };

  const [platform, setPlatform] = useState<Platform>('desktop');
  const [focalPoints, setFocalPoints] = useState<PlatformFocalPoints>({
    desktop: defaultDesktopPoint,
    mobile: defaultMobilePoint,
  });

  const focalPoint = focalPoints[platform];
  const zoomLevel = focalPoint.zoom || 1.1;
  const videoTime = focalPoint.videoTime || 0;

  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartFocalPoint, setDragStartFocalPoint] = useState({ x: focalPoint.x, y: focalPoint.y });

  // Update parent whenever ANY platform's focal point changes
  useEffect(() => {
    onFocalPointChange(focalPoints);
  }, [focalPoints, onFocalPointChange]);


  function updateFocalPoint(newFocalPoint: FocalPoint) {
    setFocalPoints(prev => ({
      ...prev,
      [platform]: newFocalPoint
    }));
  }

  function handleMediaMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartFocalPoint({ x: focalPoint.x, y: focalPoint.y }); // Capture focal point at drag start
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = videoTime;
    }
  }, [videoTime]);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isDragging && containerRef.current) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        // Convert pixel drag to focal point percentage change
        const percentDeltaX = (deltaX / containerWidth) * 100;
        const percentDeltaY = (deltaY / containerHeight) * 100;

        // Focal point moves opposite to drag direction
        const newFocalX = Math.max(0, Math.min(100, dragStartFocalPoint.x - percentDeltaX));
        const newFocalY = Math.max(0, Math.min(100, dragStartFocalPoint.y - percentDeltaY));

        const newPoint: FocalPoint = {
          x: newFocalX,
          y: newFocalY,
          zoom: zoomLevel,
          videoTime: videoTime,
        };

        updateFocalPoint(newPoint);
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, dragStartFocalPoint, zoomLevel, videoTime]);

  function handleVideoTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    const newPoint: FocalPoint = {
      x: focalPoint.x,
      y: focalPoint.y,
      zoom: zoomLevel,
      videoTime: time,
    };
    updateFocalPoint(newPoint);
  }

  function handlePlayPreview() {
    setIsVideoPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  }

  function handlePausePreview() {
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }

  function handleZoomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newZoom = parseFloat(e.target.value);
    const newPoint: FocalPoint = {
      x: focalPoint.x,
      y: focalPoint.y,
      zoom: newZoom,
      videoTime: videoTime,
    };
    updateFocalPoint(newPoint);
  }

  function handleVideoLoadedMetadata(e: React.SyntheticEvent<HTMLVideoElement>) {
    setVideoDuration(e.currentTarget.duration);
  }

  function handlePlatformChange(newPlatform: Platform) {
    setPlatform(newPlatform);
    setIsVideoPlaying(false);
  }

  const animationDelay = mediaType === 'image' ? '-4.5s' : '0s';
  const aspectRatio = PLATFORM_ASPECTS[platform];

  // Calculate viewport frame dimensions
  // The frame represents what portion of the original image is visible at the current zoom level
  // At zoom 1.1, ~90.9% of the image is visible. At zoom 1.3, ~76.9% is visible.
  const visiblePercentage = 100 / zoomLevel;

  // Frame always locked at center of preview — only the image moves
  const frameHalfSize = visiblePercentage / 2;
  const frameLeft = 50 - frameHalfSize;
  const frameTop = 50 - frameHalfSize;

  return (
    <div className="space-y-4 rounded-card border border-border bg-sage-50 p-4 dark:bg-sage-800 dark:border-sage-700">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-ink dark:text-cream-50">
            Focal Point Editor
          </label>

          {/* Platform Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePlatformChange('desktop')}
              className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                platform === 'desktop'
                  ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'bg-sage-200 text-sage-800 hover:bg-sage-300 dark:bg-sage-700 dark:text-sage-100 dark:hover:bg-sage-600'
              }`}
            >
              Desktop 16:9
            </button>
            <button
              onClick={() => handlePlatformChange('mobile')}
              className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                platform === 'mobile'
                  ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'bg-sage-200 text-sage-800 hover:bg-sage-300 dark:bg-sage-700 dark:text-sage-100 dark:hover:bg-sage-600'
              }`}
            >
              Mobile 9:16
            </button>
          </div>
        </div>

        <p className="text-xs text-muted dark:text-sage-400 mb-3">
          Drag the image to position it. The <span className="font-medium">golden frame (with red center)</span> shows exactly what will be visible in the {platform === 'desktop' ? '16:9 desktop' : '9:16 mobile'} carousel. The center is your focal point—drag to position the image behind it.
        </p>

        {/* Carousel Preview Container */}
        <div
          ref={containerRef}
          className="relative bg-sage-900 dark:bg-sage-950 rounded-card overflow-hidden border-2 border-dashed border-sage-500 dark:border-sage-600"
          style={{ aspectRatio: `${aspectRatio}` }}
        >
          {mediaType === 'image' ? (
            <Image
              src={mediaUrl}
              alt="Carousel preview"
              fill
              className="object-cover cursor-grab active:cursor-grabbing"
              draggable={false}
              priority
              onMouseDown={handleMediaMouseDown}
              style={{
                objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
                transform: `scale(${zoomLevel})`,
                animation: 'carouselFade 9s ease-in-out infinite',
                animationPlayState: isVideoPlaying ? 'running' : 'paused',
                animationDelay: animationDelay,
                userSelect: 'none',
              }}
            />
          ) : (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
              onMouseDown={handleMediaMouseDown}
              onLoadedMetadata={handleVideoLoadedMetadata}
              loop
              muted
              style={{
                objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
                transform: `scale(${zoomLevel})`,
                animation: 'carouselFade 9s ease-in-out infinite',
                animationPlayState: isVideoPlaying ? 'running' : 'paused',
                animationDelay: animationDelay,
                userSelect: 'none',
              }}
            />
          )}

          {/* Viewport Frame with Focal Point — locked at center */}
          <div
            className="absolute pointer-events-none transition-all duration-100"
            style={{
              left: `${frameLeft}%`,
              top: `${frameTop}%`,
              width: `${visiblePercentage}%`,
              height: `${visiblePercentage}%`,
              border: '3px solid #fbbf24',
              opacity: 1,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), inset 0 0 0 1px #fbbf24',
            }}
          >
            {/* Focal point marker at center of frame */}
            <div className="absolute top-1/2 left-1/2 w-6 h-6 border-3 border-red-500 rounded-full opacity-90 transform -translate-x-1/2 -translate-y-1/2 shadow-lg" />

            {/* Corner indicators for frame size */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-300" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-300" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-300" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-300" />
          </div>

          {/* Rule of thirds grid */}
          <div className="absolute inset-0 pointer-events-none opacity-15">
            <div className="absolute top-0 left-1/3 w-px h-full bg-cream-200 dark:bg-sage-500" />
            <div className="absolute top-0 left-2/3 w-px h-full bg-cream-200 dark:bg-sage-500" />
            <div className="absolute top-1/3 left-0 h-px w-full bg-cream-200 dark:bg-sage-500" />
            <div className="absolute top-2/3 left-0 h-px w-full bg-cream-200 dark:bg-sage-500" />
          </div>
        </div>

        <p className="text-xs text-muted dark:text-sage-400 mt-2">
          At <strong>{zoomLevel.toFixed(2)}x zoom</strong>, the frame shows <strong>{visiblePercentage.toFixed(1)}%</strong> of your media. Adjust zoom to show more or less of the image while keeping the focal point centered.
        </p>

        {/* Video Timeline */}
        {mediaType === 'video' && videoDuration > 0 && (
          <div className="mt-3 space-y-2">
            <label htmlFor="video-time" className="text-xs font-medium text-ink dark:text-cream-50">
              Frame Timeline
            </label>
            <input
              id="video-time"
              type="range"
              min="0"
              max={videoDuration}
              step="0.1"
              value={videoTime}
              onChange={handleVideoTimeChange}
              className="w-full h-2 bg-sage-200 dark:bg-sage-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted dark:text-sage-400">
                {videoTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePlayPreview}
                  className="text-xs px-2 py-1 bg-sage-200 dark:bg-sage-700 hover:bg-sage-300 dark:hover:bg-sage-600 rounded text-ink dark:text-cream-50 font-medium transition-colors"
                >
                  Play
                </button>
                <button
                  onClick={handlePausePreview}
                  className="text-xs px-2 py-1 bg-sage-200 dark:bg-sage-700 hover:bg-sage-300 dark:hover:bg-sage-600 rounded text-ink dark:text-cream-50 font-medium transition-colors"
                >
                  Pause
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="zoom-slider" className="text-xs font-medium text-ink dark:text-cream-50">
              Zoom Level
            </label>
            <span className="text-xs font-mono bg-sage-200 dark:bg-sage-700 px-2 py-1 rounded text-ink dark:text-cream-50">
              {zoomLevel.toFixed(2)}x
            </span>
          </div>
          <input
            id="zoom-slider"
            type="range"
            min="1"
            max="2"
            step="0.05"
            value={zoomLevel}
            onChange={handleZoomChange}
            className="w-full h-2 bg-sage-200 dark:bg-sage-700 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-muted dark:text-sage-400">
            Higher zoom = tighter crop (showing less of the image). Lower zoom = wider view. Adjust to frame the most important part of your image.
          </p>
        </div>

        <style>{`
          @keyframes carouselFade {
            0% { opacity: 0; }
            22.2% { opacity: 1; }
            77.8% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
