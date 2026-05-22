'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FocalPointEditor } from './FocalPointEditor';
import { createBrowserClient } from '@/lib/supabase/client';

interface MediaItem {
  id: string;
  file_url: string;
  media_type: 'image' | 'video';
  title: string;
  description: string | null;
  category: string;
  featured: boolean;
  featured_order: number | null;
  focal_point: { x: number; y: number } | null;
  created_at: string;
}

const CATEGORIES = ['general', 'carousel', 'event-photos', 'gallery'];

/**
 * Combined media library and gallery for admin portal.
 * Upload directly (no category required), manage all media, feature items for carousel.
 */
export function MediaManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MediaItem>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // Load media on mount
  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('media')
        .select('*')
        .order('featured', { ascending: false })
        .order('featured_order', { ascending: true, nullsLast: true })
        .order('created_at', { ascending: false });

      if (err) throw err;
      setMedia(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) return;

    // Validation
    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
    const ALLOWED_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (selectedFile.size > MAX_SIZE) {
      setError('File must be 50MB or smaller.');
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, WEBP images or MP4, WEBM, MOV videos are allowed.');
      return;
    }

    const mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
    await uploadFile(selectedFile, mediaType);
  }

  async function uploadFile(fileToUpload: File, mediaType: 'image' | 'video') {
    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(fileToUpload.name);
    setError(null);

    try {
      const ext = fileToUpload.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      console.log(`Starting upload: ${filename} (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB)`);

      // Upload to storage with progress tracking
      const { error: uploadErr, data } = await supabase.storage
        .from('media')
        .upload(filename, fileToUpload, {
          contentType: fileToUpload.type,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Upload progress: ${percent}%`);
            setUploadProgress(percent);
          },
        });

      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        throw uploadErr;
      }

      console.log('Upload completed, getting URL...');

      // Get public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('Saving to database...');

      // Create media record with default 'general' category
      const { error: dbErr } = await supabase.from('media').insert({
        file_url: urlData.publicUrl,
        media_type: mediaType,
        title: fileToUpload.name.replace(/\.[^/.]+$/, ''),
        description: null,
        category: 'general',
        featured: false,
      });

      if (dbErr) {
        console.error('Database error:', dbErr);
        throw dbErr;
      }

      console.log('Upload successful!');
      setSuccess('Media uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await loadMedia();

      // Reset input and progress
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadProgress(0);
      setUploadFileName('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      console.error('Upload error:', errorMsg);
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  }

  async function toggleFeatured(id: string, currentFeatured: boolean) {
    try {
      const { error: err } = await supabase
        .from('media')
        .update({
          featured: !currentFeatured,
          featured_order: !currentFeatured ? 0 : null,
        })
        .eq('id', id);

      if (err) throw err;
      await loadMedia();
      setSuccess(`Media ${!currentFeatured ? 'featured' : 'unfeatured'}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update media');
    }
  }

  async function saveEdit() {
    if (!editingId) return;

    try {
      const { error: err } = await supabase
        .from('media')
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          focal_point: editForm.focal_point,
        })
        .eq('id', editingId);

      if (err) throw err;
      await loadMedia();
      setEditingId(null);
      setSuccess('Media updated');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update media');
    }
  }

  async function deleteMedia(id: string) {
    try {
      const item = media.find((m) => m.id === id);
      if (!item) return;

      // Delete from storage
      const filename = item.file_url.split('/').pop();
      if (filename) {
        await supabase.storage.from('media').remove([filename]);
      }

      // Delete from database
      const { error: err } = await supabase.from('media').delete().eq('id', id);
      if (err) throw err;

      await loadMedia();
      setDeleteConfirmId(null);
      setSuccess('Media deleted');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete media');
    }
  }

  const featuredMedia = media.filter((m) => m.featured);
  const allMedia = media;

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="rounded-card border border-border bg-surface p-6 dark:bg-sage-900 dark:border-sage-700">
        <h2 className="mb-4 font-display text-xl font-semibold text-sage-900 dark:text-cream-50">Upload Media</h2>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted dark:text-sage-300">
            Select an image or video. Category can be set or changed later in the media details.
          </p>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            loading={uploading}
            className="sm:whitespace-nowrap"
          >
            {uploading ? `Uploading (${uploadProgress}%)...` : 'Choose File'}
          </Button>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="mb-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-sage-900 dark:text-cream-50">Upload progress</p>
                <p className="text-sm text-muted dark:text-sage-400">{uploadProgress}%</p>
              </div>
              <p className="text-xs text-muted dark:text-sage-400">{uploadFileName}</p>
            </div>
            <div className="h-2 w-full rounded-full bg-sage-100 dark:bg-sage-700 overflow-hidden">
              <div
                className="h-full bg-sage-600 dark:bg-sage-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />

        <p className="mt-2 text-xs text-muted dark:text-sage-400">
          Images: JPEG, PNG, WEBP • Videos: MP4, WEBM, MOV • Max 50MB
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-card border border-terracotta-200 bg-terracotta-50 p-3 text-sm text-terracotta-700 dark:border-terracotta-700 dark:bg-terracotta-950 dark:text-terracotta-400">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="rounded-card border border-sage-200 bg-sage-50 p-3 text-sm text-sage-800 dark:border-sage-700 dark:bg-sage-900 dark:text-sage-200">
          ✓ {success}
        </div>
      )}

      {/* Featured Items Section */}
      {featuredMedia.length > 0 && (
        <div className="rounded-card border border-border bg-surface p-6 dark:bg-sage-900 dark:border-sage-700">
          <h2 className="mb-4 font-display text-xl font-semibold text-sage-900 dark:text-cream-50">
            Carousel Features ({featuredMedia.length})
          </h2>
          <p className="mb-4 text-sm text-muted dark:text-sage-300">
            These items appear in the homepage carousel in order.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredMedia.map((item) => (
              <div key={item.id} className="group overflow-hidden rounded-card border border-border dark:border-sage-700">
                <div className="relative aspect-video bg-sage-50 dark:bg-sage-800">
                  {item.file_url?.startsWith('http') ? (
                    item.media_type === 'image' ? (
                      <Image
                        src={item.file_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.file_url}
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-sage-100 dark:bg-sage-700 text-muted dark:text-sage-400 text-sm">
                      Invalid URL
                    </div>
                  )}
                </div>
                <div className="p-3 dark:bg-sage-900 dark:border-t dark:border-sage-700">
                  <p className="font-medium text-ink dark:text-cream-50 text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted dark:text-sage-400">{item.category}</p>
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={() => toggleFeatured(item.id, item.featured)}
                      className="text-xs rounded px-2 py-1 bg-sage-100 text-sage-800 hover:bg-sage-200 dark:bg-sage-700 dark:text-sage-100 dark:hover:bg-sage-600"
                    >
                      ★ Featured
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditForm(item);
                      }}
                      className="text-xs rounded px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Media Section */}
      <div className="rounded-card border border-border bg-surface p-6 dark:bg-sage-900 dark:border-sage-700">
        <h2 className="mb-4 font-display text-xl font-semibold text-sage-900 dark:text-cream-50">
          All Media ({allMedia.length})
        </h2>

        {loading ? (
          <p className="text-muted dark:text-sage-300">Loading media...</p>
        ) : allMedia.length === 0 ? (
          <p className="text-muted dark:text-sage-300">No media yet. Upload something to get started.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allMedia.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-card border border-border bg-sage-50 dark:bg-sage-900 dark:border-sage-700"
              >
                <div className="relative aspect-video bg-sage-50 dark:bg-sage-800">
                  {item.file_url?.startsWith('http') ? (
                    item.media_type === 'image' ? (
                      <Image
                        src={item.file_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.file_url}
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-sage-100 dark:bg-sage-700 text-muted dark:text-sage-400 text-sm">
                      Invalid URL
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-ink dark:text-cream-50 truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted dark:text-sage-400 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-xs text-muted dark:text-sage-400 mt-1">
                    {item.media_type === 'image' ? '🖼️ Image' : '🎬 Video'} • {item.category}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleFeatured(item.id, item.featured)}
                      className={`text-xs rounded px-2 py-1 ${
                        item.featured
                          ? 'bg-sage-200 text-sage-900 dark:bg-sage-700 dark:text-sage-100'
                          : 'bg-sage-100 text-sage-800 hover:bg-sage-200 dark:bg-sage-700 dark:text-sage-100 dark:hover:bg-sage-600'
                      }`}
                    >
                      {item.featured ? '★ Featured' : '☆ Feature'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditForm(item);
                      }}
                      className="text-xs rounded px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="text-xs rounded px-2 py-1 bg-terracotta-100 text-terracotta-800 hover:bg-terracotta-200 dark:bg-terracotta-900 dark:text-terracotta-200 dark:hover:bg-terracotta-800"
                    >
                      Delete
                    </button>
                  </div>

                  {deleteConfirmId === item.id && (
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => deleteMedia(item.id)}
                        className="text-xs rounded px-2 py-1 bg-terracotta-600 text-white hover:bg-terracotta-700 dark:bg-terracotta-700 dark:hover:bg-terracotta-600"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs rounded px-2 py-1 bg-border text-ink hover:bg-sage-100 dark:bg-sage-700 dark:text-cream-50 dark:hover:bg-sage-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 overflow-y-auto">
          <div className="rounded-card bg-surface p-6 max-w-2xl w-full my-8 dark:bg-sage-900 dark:border dark:border-sage-700">
            <h3 className="mb-4 font-display text-lg font-semibold text-sage-900 dark:text-cream-50">Edit Media</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form fields */}
              <div className="space-y-4">
                <Input
                  label="Title"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />

                <div>
                  <label htmlFor="desc" className="block text-sm font-medium text-ink dark:text-cream-50 mb-1">
                    Description
                  </label>
                  <textarea
                    id="desc"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-card border border-border bg-surface px-3 py-2 text-ink dark:bg-sage-800 dark:text-cream-50 dark:border-sage-700"
                  />
                </div>

                <div>
                  <label htmlFor="edit-cat" className="block text-sm font-medium text-ink dark:text-cream-50 mb-1">
                    Category
                  </label>
                  <select
                    id="edit-cat"
                    value={editForm.category || 'general'}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full rounded-card border border-border bg-surface px-3 py-2 text-ink dark:bg-sage-800 dark:text-cream-50 dark:border-sage-700"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Focal point editor */}
              {editForm.file_url && (
                <FocalPointEditor
                  mediaUrl={editForm.file_url}
                  mediaType={editForm.media_type || 'image'}
                  currentFocalPoint={editForm.focal_point}
                  onFocalPointChange={(point) => setEditForm({ ...editForm, focal_point: point })}
                />
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={saveEdit} className="flex-1">
                Save
              </Button>
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 rounded-card border border-border bg-surface px-4 py-2 text-ink hover:bg-sage-50 dark:border-sage-700 dark:bg-sage-800 dark:text-cream-50 dark:hover:bg-sage-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
