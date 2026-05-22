'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createBrowserClient } from '@/lib/supabase/client';

interface AvatarUploadProps {
  currentImageUrl?: string | null;
  onImageUrlChange: (url: string | null) => void;
  isLoading?: boolean;
  storagePath: 'vendor-logos' | 'vendor-owner-photos';
  alt: string;
  size?: 'sm' | 'md' | 'lg'; // 120px, 180px, 240px
}

const sizeMap = {
  sm: { container: 'h-32 w-32', maxW: '128px' },
  md: { container: 'h-48 w-48', maxW: '192px' },
  lg: { container: 'h-64 w-64', maxW: '256px' },
};

/**
 * Avatar upload component with pencil icon overlay.
 * Click the pencil or the image to upload a new photo.
 */
export function AvatarUpload({
  currentImageUrl,
  onImageUrlChange,
  isLoading = false,
  storagePath,
  alt,
  size = 'md',
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const sizeClass = sizeMap[size];

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) {
      setPreview(null);
      return;
    }

    // Validation
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (selectedFile.size > MAX_BYTES) {
      setError('File must be 10MB or smaller.');
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, or WEBP images are allowed.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);

    // Auto-upload
    await uploadFile(selectedFile);
  }

  async function uploadFile(fileToUpload: File) {
    setUploading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const ext = fileToUpload.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(storagePath)
        .upload(filename, fileToUpload, { contentType: fileToUpload.type });

      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data } = supabase.storage.from(storagePath).getPublicUrl(filename);
      onImageUrlChange(data.publicUrl);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = preview || currentImageUrl;

  return (
    <div className="flex flex-col gap-3">
      {/* Avatar Container */}
      <div
        className={`group relative cursor-pointer overflow-hidden rounded-card border-2 border-sage-200 bg-sage-50 transition ${sizeClass.container}`}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        aria-label={`Upload ${alt}`}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={alt}
            fill
            className="object-contain p-2"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-muted">
            <span className="text-xs font-medium">No photo</span>
          </div>
        )}

        {/* Pencil Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="flex items-center justify-center rounded-full bg-white p-3 text-sage-900 hover:bg-sage-100"
            disabled={uploading || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Loading Indicator */}
        {(uploading || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={uploading || isLoading}
        className="hidden"
      />

      {/* Error Message */}
      {error && <p className="text-xs text-terracotta-700">{error}</p>}

      {/* Help Text */}
      {!error && (
        <p className="text-xs text-muted">
          Click or hover to upload • JPEG, PNG, WEBP • Max 10MB
        </p>
      )}
    </div>
  );
}
