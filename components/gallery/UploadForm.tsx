'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { createBrowserClient } from '@/lib/supabase/client';
import type { UploaderType } from '@/types';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per spec

interface UploadFormProps {
  onDone: () => void;
}

export function UploadForm({ onDone }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploaderType, setUploaderType] = useState<UploaderType>('guest');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError('Please choose a photo.');
    if (file.size > MAX_BYTES) return setError('Files must be 10MB or smaller.');
    if (!file.type.startsWith('image/')) return setError('Only image files are allowed.');
    if (!consent) return setError('You must check the consent box to upload.');

    setSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const storagePath = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('gallery')
        .upload(storagePath, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase.from('gallery').insert({
        storage_path: storagePath,
        uploader_type: uploaderType,
        caption: caption || null,
        consent_given: true,
        // approved + featured default to false in the DB
      });
      if (insertErr) throw insertErr;

      setSuccess(true);
      setTimeout(onDone, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <p className="text-sage-800">✓ Upload received! It will appear once approved by our team.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Photo
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="min-h-touch text-sm"
        />
        <span className="text-xs text-muted">JPEG, PNG, or WEBP. Max 10MB.</span>
      </label>

      <Textarea
        label="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={2}
        maxLength={280}
      />

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="font-medium text-ink">I am uploading as:</legend>
        <label className="flex min-h-touch items-center gap-2">
          <input
            type="radio"
            name="uploader"
            checked={uploaderType === 'guest'}
            onChange={() => setUploaderType('guest')}
          />
          Guest / attendee
        </label>
        <label className="flex min-h-touch items-center gap-2">
          <input
            type="radio"
            name="uploader"
            checked={uploaderType === 'vendor'}
            onChange={() => setUploaderType('vendor')}
          />
          Vendor
        </label>
      </fieldset>

      <label className="flex items-start gap-3 rounded-card bg-cream-50 p-3 text-sm">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-5 w-5"
        />
        <span>
          I consent to this photo being used by Magic City Plant-A-Palooza for promotional and marketing purposes.
        </span>
      </label>

      {error ? (
        <p role="alert" className="rounded border border-terracotta-300 bg-terracotta-50 p-3 text-sm text-terracotta-800">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Upload
        </Button>
      </div>
    </form>
  );
}
