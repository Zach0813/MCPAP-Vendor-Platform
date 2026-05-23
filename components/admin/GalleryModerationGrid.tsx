'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@/lib/supabase/client';
import { getGalleryPublicUrl } from '@/lib/gallery-url';
import { Modal } from '@/components/ui/Modal';
import type { GalleryItem } from '@/types';

export function GalleryModerationGrid({ items }: { items: GalleryItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingFocalPoint, setEditingFocalPoint] = useState<GalleryItem | null>(null);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(91);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Boundary is 16:9 rectangle (aspect ratio of homepage hero), sized by zoom level
  const boundaryWidth = zoomLevel;
  const boundaryHeight = (boundaryWidth * 9) / 16; // 16:9 aspect ratio
  const boundaryHalf = boundaryHeight / 2;
  const boundaryLeft = Math.max(0, Math.min(focalX - boundaryWidth / 2, 100 - boundaryWidth));
  const boundaryTop = Math.max(0, Math.min(focalY - boundaryHeight / 2, 100 - boundaryHeight));

  const handleImageInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setFocalX(Math.max(0, Math.min(x, 100)));
    setFocalY(Math.max(0, Math.min(y, 100)));
  };

  const handleStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleImageInteraction(e);
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleImageInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const setPreset = (x: number, y: number) => {
    setFocalX(Math.max(boundaryWidth / 2, Math.min(x, 100 - boundaryWidth / 2)));
    setFocalY(Math.max(boundaryHeight / 2, Math.min(y, 100 - boundaryHeight / 2)));
  };

  async function update(id: string, patch: Partial<Omit<GalleryItem, 'id'>>) {
    setBusyId(id);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.from('gallery').update(patch).eq('id', id);
      if (error) throw error;
      location.reload();
    } catch (err) {
      console.error('Update error:', err);
      setBusyId(null);
    }
  }

  async function remove(id: string, storage_path: string) {
    if (!confirm('Delete this photo permanently?')) return;
    setBusyId(id);
    try {
      const supabase = createBrowserClient();
      await supabase.storage.from('gallery').remove([storage_path]);
      await supabase.from('gallery').delete().eq('id', id);
      location.reload();
    } finally {
      setBusyId(null);
    }
  }

  async function saveFocalPoint() {
    if (!editingFocalPoint) return;
    setBusyId(editingFocalPoint.id);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('gallery')
        .update({ focal_point: { x: focalX, y: focalY } })
        .eq('id', editingFocalPoint.id);

      if (error) {
        console.error('Save error:', error);
        throw error;
      }

      setEditingFocalPoint(null);
      location.reload();
    } catch (err) {
      console.error('Error saving focal point:', err);
      setBusyId(null);
    }
  }

  function openFocalPointEditor(item: GalleryItem) {
    setEditingFocalPoint(item);
    setFocalX(item.focal_point?.x ?? 50);
    setFocalY(item.focal_point?.y ?? 50);
    setZoomLevel(91);
    setImageDimensions(null);
  }

  if (items.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border p-6 text-muted">
        No photos uploaded yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <Image
            src={getGalleryPublicUrl(item.storage_path)}
            alt={item.caption ?? 'Gallery photo'}
            width={400}
            height={300}
            className="h-48 w-full object-contain bg-sage-50"
          />
          <div className="p-3">
            {item.caption ? <p className="line-clamp-2 text-sm">{item.caption}</p> : null}
            <p className="mt-1 text-xs text-muted">
              {item.uploader_type} · {new Date(item.created_at).toLocaleDateString()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!item.approved ? (
                <Button
                  size="sm"
                  variant="primary"
                  loading={busyId === item.id}
                  onClick={() => update(item.id, { approved: true })}
                >
                  Approve
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                loading={busyId === item.id}
                onClick={() => update(item.id, { featured: !item.featured })}
              >
                {item.featured ? 'Unfeature' : 'Feature'}
              </Button>
              {item.featured ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openFocalPointEditor(item)}
                >
                  Focal point
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="danger"
                loading={busyId === item.id}
                onClick={() => remove(item.id, item.storage_path)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Focal Point Editor Modal */}
      <Modal
        open={!!editingFocalPoint}
        onClose={() => setEditingFocalPoint(null)}
        title="Set Focal Point"
      >
        {editingFocalPoint && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Click to set focal point. Dashed border shows what's visible on homepage. Solid border shows zoom area.
            </p>

            {/* Image with overlays */}
            <div
              ref={imageContainerRef}
              className="relative overflow-hidden rounded-card bg-sage-50 cursor-crosshair select-none"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleMouseUp}
              onDragStart={(e) => e.preventDefault()}
            >
              <div className="relative inline-block w-full bg-sage-50">
                <Image
                  src={getGalleryPublicUrl(editingFocalPoint.storage_path)}
                  alt="Focal point preview"
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain"
                  priority
                  onLoad={(result) => {
                    const target = result.currentTarget as HTMLImageElement;
                    if (target.naturalWidth && target.naturalHeight) {
                      setImageDimensions({
                        width: target.naturalWidth,
                        height: target.naturalHeight,
                      });
                    }
                  }}
                />

                {/* Overlay annotations */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Focal point zoom boundary (16:9 aspect ratio) */}
                  <div
                    className="absolute border-2 border-terracotta-400"
                    style={{
                      left: `${boundaryLeft}%`,
                      top: `${boundaryTop}%`,
                      width: `${boundaryWidth}%`,
                      height: `${boundaryHeight}%`,
                      boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.8)',
                    }}
                  />

                  {/* Focal point crosshair */}
                  <div
                    className="absolute w-8 h-8 border-2 border-white rounded-full"
                    style={{
                      left: `${focalX}%`,
                      top: `${focalY}%`,
                      transform: 'translate(-50%, -50%)',
                      filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.8))',
                    }}
                  >
                    <div className="absolute inset-2 border border-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Zoom slider */}
            <div className="space-y-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-ink">Zoom: {zoomLevel}%</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-full"
                />
              </label>
            </div>

            {/* Preset buttons */}
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => setPreset(50, 50)}
                className="rounded-card border border-border bg-surface px-2 py-2 text-xs font-medium text-ink hover:bg-sage-50"
              >
                Center
              </button>
              <button
                onClick={() => setPreset(50, boundaryHalf)}
                className="rounded-card border border-border bg-surface px-2 py-2 text-xs font-medium text-ink hover:bg-sage-50"
              >
                Top
              </button>
              <button
                onClick={() => setPreset(50, 100 - boundaryHalf)}
                className="rounded-card border border-border bg-surface px-2 py-2 text-xs font-medium text-ink hover:bg-sage-50"
              >
                Bottom
              </button>
              <button
                onClick={() => setPreset(boundaryHalf, 50)}
                className="rounded-card border border-border bg-surface px-2 py-2 text-xs font-medium text-ink hover:bg-sage-50"
              >
                Left
              </button>
              <button
                onClick={() => setPreset(100 - boundaryHalf, 50)}
                className="rounded-card border border-border bg-surface px-2 py-2 text-xs font-medium text-ink hover:bg-sage-50"
              >
                Right
              </button>
            </div>

            {/* Save/Cancel buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingFocalPoint(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={busyId === editingFocalPoint.id}
                onClick={saveFocalPoint}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
