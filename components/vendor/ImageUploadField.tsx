'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  currentImageUrl?: string | null;
  onImageUrlChange: (url: string | null) => void;
  isLoading?: boolean;
  storagePath: 'vendor-logos' | 'vendor-owner-photos' | 'vendor-product-photos';
}

/**
 * Reusable image upload field for vendor photos.
 * Uploads directly to Supabase storage and returns the public URL.
 */
export function ImageUploadField({
  label,
  hint,
  currentImageUrl,
  onImageUrlChange,
  isLoading = false,
  storagePath,
}: ImageUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    // Validation
    if (selectedFile.size > MAX_BYTES) {
      setError('File must be 10MB or smaller.');
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, or WEBP images are allowed.');
      setFile(null);
      return;
    }

    setFile(selectedFile);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);

    // Auto-upload after file validation
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

      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink dark:text-cream-50">
        {label}
        <span className="ml-1 text-xs text-muted dark:text-sage-400">(optional)</span>
      </label>

      {/* Current image preview */}
      {currentImageUrl && !preview && (
        <div className="relative h-40 w-40 overflow-hidden rounded-card border border-border dark:border-sage-700">
          <Image
            src={currentImageUrl}
            alt={label}
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => onImageUrlChange(null)}
            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded bg-terracotta-600 text-sm text-cream-50 hover:bg-terracotta-700"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      {/* New file preview */}
      {preview && (
        <div className="relative h-40 w-40 overflow-hidden rounded-card border border-border bg-sage-50 dark:border-sage-700 dark:bg-sage-800">
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="text-sm font-medium text-cream-50">New</span>
          </div>
        </div>
      )}

      {/* File input */}
      <div
        className={cn(
          'rounded-card border border-dashed border-border p-4 text-center transition dark:border-sage-700 dark:bg-sage-900/50',
          uploading && 'opacity-50'
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={uploading || isLoading}
          className="hidden"
          id={`upload-${storagePath}`}
        />
        <label htmlFor={`upload-${storagePath}`} className="block cursor-pointer">
          <p className="text-sm font-medium text-ink dark:text-cream-50">
            {uploading ? 'Uploading...' : 'Click to choose image'}
          </p>
          <p className="text-xs text-muted dark:text-sage-400">JPEG, PNG, or WEBP • Max 10MB</p>
        </label>
      </div>

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm text-terracotta-700 dark:text-terracotta-400">
          {error}
        </p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-xs text-muted dark:text-sage-400">{hint}</p>
      )}
    </div>
  );
}
