'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface FocalPoint {
  x: number; // 0-100 (percentage)
  y: number; // 0-100 (percentage)
  zoom?: number; // zoom level (1-3)
  videoTime?: number; // current video timestamp in seconds
}

interface FocalPointEditorProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  currentFocalPoint: FocalPoint | null;
  onFocalPointChange: (point: FocalPoint) => void;
}

/**
 * Focal point editor for images and videos
 * Click or drag the crosshair to set the focal point
 * Shows 16:9 carousel preview with darkened edges
 */
export function FocalPointEditor({
  mediaUrl,
  mediaType,
  currentFocalPoint,
  onFocalPointChange,
}: FocalPointEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const defaultFocalPoint = currentFocalPoint || { x: 50, y: 50, zoom: 1, videoTime: 0 };
  const [focalPoint, setFocalPoint] = useState<FocalPoint>(defaultFocalPoint);

  // Calculate initial media offset from focal point
  // Reverse formula: offsetX = (50 - focalX) * (containerWidth / 100)
  const [mediaOffset, setMediaOffset] = useState(() => {
    // We'll calculate this properly in useEffect once container is available
    return { x: 0, y: 0 };
  });
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoTime, setVideoTime] = useState((currentFocalPoint?.videoTime as number) || 0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState((currentFocalPoint?.zoom as number) || 1);

  function updateFocalPointFromOffset(offsetX: number, offsetY: number) {
    // Convert pixel offset to focal point percentage (0-100)
    // Positive offset = moving media right/down = focal point shifts left/up
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    // Calculate focal point based on media position
    const focalX = 50 - (offsetX / containerWidth) * 100;
    const focalY = 50 - (offsetY / containerHeight) * 100;

    const newPoint: FocalPoint = {
      x: Math.max(0, Math.min(100, focalX)),
      y: Math.max(0, Math.min(100, focalY)),
      zoom: zoomLevel,
      videoTime: videoTime,
    };

    setFocalPoint(newPoint);
    onFocalPointChange(newPoint);
  }

  function handleMediaMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = videoTime;
    }
  }, [videoTime]);

  // When focal point changes (e.g., opening edit modal), calculate the media offset needed
  useEffect(() => {
    if (containerRef.current && currentFocalPoint) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      // Reverse the focal point calculation to get media offset
      // Original: focalX = 50 - (offsetX / containerWidth) * 100
      // Reverse: offsetX = (50 - focalX) * (containerWidth / 100)
      const offsetX = (50 - currentFocalPoint.x) * (containerWidth / 100);
      const offsetY = (50 - currentFocalPoint.y) * (containerHeight / 100);

      setMediaOffset({ x: offsetX, y: offsetY });
      setFocalPoint(currentFocalPoint);
      setZoomLevel((currentFocalPoint.zoom as number) || 1);
      setVideoTime((currentFocalPoint.videoTime as number) || 0);
    }
  }, [currentFocalPoint]);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        setMediaOffset({ x: deltaX, y: deltaY });
        updateFocalPointFromOffset(deltaX, deltaY);
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
  }, [isDragging, dragStart]);

  function handleVideoTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    setVideoTime(time);
    setIsVideoPlaying(false);
    // Pause video while scrubbing so user can see the exact frame
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // Sync video time change to parent
    const newPoint: FocalPoint = {
      x: focalPoint.x,
      y: focalPoint.y,
      zoom: zoomLevel,
      videoTime: time,
    };
    onFocalPointChange(newPoint);
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
    setZoomLevel(newZoom);
    // Sync zoom change to parent
    const newPoint: FocalPoint = {
      x: focalPoint.x,
      y: focalPoint.y,
      zoom: newZoom,
      videoTime: videoTime,
    };
    onFocalPointChange(newPoint);
  }

  function handleAlignHorizontal() {
    // Center horizontally (x = 50) while keeping vertical position
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const offsetX = (50 - 50) * (containerWidth / 100);
    setMediaOffset({ x: offsetX, y: mediaOffset.y });
    updateFocalPointFromOffset(offsetX, mediaOffset.y);
  }

  function handleAlignVertical() {
    // Center vertically (y = 50) while keeping horizontal position
    if (!containerRef.current) return;
    const containerHeight = containerRef.current.offsetHeight;
    const offsetY = (50 - 50) * (containerHeight / 100);
    setMediaOffset({ x: mediaOffset.x, y: offsetY });
    updateFocalPointFromOffset(mediaOffset.x, offsetY);
  }

  function handleVideoLoadedMetadata(e: React.SyntheticEvent<HTMLVideoElement>) {
    setVideoDuration(e.currentTarget.duration);
  }

  function handleVideoError(e: React.SyntheticEvent<HTMLVideoElement>) {
    console.error('Video error:', e.currentTarget.error?.code, e.currentTarget.error?.message);
  }

  // For images, pause animation at the hold portion (middle of 5s hold = 4.5s into 9s cycle)
  // For videos, animation always starts from beginning of fade-in (0s) when paused
  const animationDelay = mediaType === 'image' ? '-4.5s' : '0s';

  // Calculate 16:9 preview box dimensions
  const CAROUSEL_ASPECT = 16 / 9; // 1.778
  const imageWidth = 100;
  const imageHeight = 100;

  // Calculate preview box size (fit 16:9 within the image bounds)
  let previewWidth = imageWidth;
  let previewHeight = previewWidth / CAROUSEL_ASPECT;

  if (previewHeight > imageHeight) {
    previewHeight = imageHeight;
    previewWidth = previewHeight * CAROUSEL_ASPECT;
  }

  // Center the preview box on the focal point
  const previewLeft = Math.max(0, Math.min(100 - previewWidth, focalPoint.x - previewWidth / 2));
  const previewTop = Math.max(0, Math.min(100 - previewHeight, focalPoint.y - previewHeight / 2));

  return (
    <div className="space-y-4 rounded-card border border-border bg-sage-50 p-4 dark:bg-sage-800 dark:border-sage-700">
      <div>
        <label className="block text-sm font-medium text-ink dark:text-cream-50 mb-2">
          Focal Point Editor
        </label>
        <p className="text-xs text-muted dark:text-sage-400 mb-3">
          Click or drag the crosshair to position the focal point. The highlighted box shows what appears in the 16:9 carousel.
        </p>

        {/* 16:9 Preview Container - matches carousel aspect ratio */}
        <div
          ref={containerRef}
          className="relative bg-sage-900 dark:bg-sage-950 rounded-card overflow-hidden border-2 border-dashed border-sage-500 dark:border-sage-600"
          style={{ aspectRatio: '16/9' }}
        >
          {mediaType === 'image' ? (
            <Image
              src={mediaUrl}
              alt="Carousel preview - drag to reposition"
              fill
              className="object-contain cursor-grab active:cursor-grabbing"
              draggable={false}
              priority
              onMouseDown={handleMediaMouseDown}
              style={{
                transform: `translate(${mediaOffset.x}px, ${mediaOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center',
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
              className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
              onMouseDown={handleMediaMouseDown}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onError={handleVideoError}
              loop
              muted
              style={{
                transform: `translate(${mediaOffset.x}px, ${mediaOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center',
                animation: 'carouselFade 9s ease-in-out infinite',
                animationPlayState: isVideoPlaying ? 'running' : 'paused',
                animationDelay: animationDelay,
                userSelect: 'none',
              }}
            />
          )}

          {/* Center crosshairs showing focal point */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Vertical center line */}
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-cream-100 dark:via-sage-400 to-transparent opacity-60 transform -translate-x-1/2" />
            {/* Horizontal center line */}
            <div className="absolute top-1/2 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-cream-100 dark:via-sage-400 to-transparent opacity-60 transform -translate-y-1/2" />
            {/* Center circle indicator */}
            <div className="absolute top-1/2 left-1/2 w-3 h-3 border-2 border-cream-100 dark:border-sage-400 rounded-full opacity-60 transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Subtle rule of thirds grid */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {/* Vertical thirds */}
            <div className="absolute top-0 left-1/3 w-px h-full bg-cream-200 dark:bg-sage-500" />
            <div className="absolute top-0 left-2/3 w-px h-full bg-cream-200 dark:bg-sage-500" />
            {/* Horizontal thirds */}
            <div className="absolute top-1/3 left-0 h-px w-full bg-cream-200 dark:bg-sage-500" />
            <div className="absolute top-2/3 left-0 h-px w-full bg-cream-200 dark:bg-sage-500" />
          </div>
        </div>
        <p className="text-xs text-muted dark:text-sage-400 mt-2">
          Drag the image/video within the frame to position it. Use the zoom slider for fine adjustments. The preview shows the carousel fade sequence (2s in → 5s hold → 2s out).
        </p>

        {/* Video timeline */}
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

        {/* Zoom and Alignment Controls */}
        <div className="mt-3 space-y-2">
          <label htmlFor="zoom-slider" className="text-xs font-medium text-ink dark:text-cream-50">
            Zoom ({zoomLevel.toFixed(1)}x)
          </label>
          <input
            id="zoom-slider"
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoomLevel}
            onChange={handleZoomChange}
            className="w-full h-2 bg-sage-200 dark:bg-sage-700 rounded-lg appearance-none cursor-pointer"
          />

          {/* Alignment Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAlignHorizontal}
              className="flex-1 text-xs px-3 py-1.5 bg-sage-200 dark:bg-sage-700 hover:bg-sage-300 dark:hover:bg-sage-600 rounded text-ink dark:text-cream-50 font-medium transition-colors"
            >
              Align Horizontal
            </button>
            <button
              onClick={handleAlignVertical}
              className="flex-1 text-xs px-3 py-1.5 bg-sage-200 dark:bg-sage-700 hover:bg-sage-300 dark:hover:bg-sage-600 rounded text-ink dark:text-cream-50 font-medium transition-colors"
            >
              Align Vertical
            </button>
          </div>
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
