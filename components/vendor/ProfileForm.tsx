'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from './ImageUploadField';
import { AvatarUpload } from './AvatarUpload';
import { createBrowserClient } from '@/lib/supabase/client';
import { VENDOR_CATEGORY, type Vendor, type VendorCategory } from '@/types';

interface ProfileFormProps {
  initialValues: Vendor | null;
}

/**
 * Vendor profile editor. RLS prevents status changes via the trigger we
 * installed in the migration, so we just don't render the field.
 */
export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    category: (initialValues?.category ?? 'plants') as VendorCategory,
    website: initialValues?.website ?? '',
    instagram_handle: initialValues?.instagram_handle ?? '',
    facebook_handle: initialValues?.facebook_handle ?? '',
    tiktok_handle: initialValues?.tiktok_handle ?? '',
    phone: initialValues?.phone ?? '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(initialValues?.logo_url ?? null);
  const [ownerPhotoUrl, setOwnerPhotoUrl] = useState<string | null>(initialValues?.owner_photo_url ?? null);
  const [featuredPhotoUrl, setFeaturedPhotoUrl] = useState<string | null>(initialValues?.featured_photo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!initialValues) {
    return (
      <p className="rounded-card border border-dashed border-border p-6 text-muted dark:border-sage-700 dark:text-sage-300">
        No vendor profile exists for your account yet. Once an admin approves your
        application, you&apos;ll be able to edit it here.
      </p>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const supabase = createBrowserClient();
      const { error: updateErr } = await supabase
        .from('vendors')
        .update({
          ...form,
          logo_url: logoUrl,
          owner_photo_url: ownerPhotoUrl,
          featured_photo_url: featuredPhotoUrl,
        })
        .eq('id', initialValues!.id);
      if (updateErr) throw updateErr;
      setSavedMsg('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-card border border-border bg-surface dark:bg-sage-900 dark:border-sage-700">
      {/* Profile Header Section */}
      <div className="border-b border-border p-6 dark:border-sage-700">
        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          {/* Avatar/Logo Area */}
          <div>
            <AvatarUpload
              currentImageUrl={logoUrl}
              onImageUrlChange={setLogoUrl}
              isLoading={saving}
              storagePath="vendor-logos"
              alt="Business logo"
              size="md"
            />
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-sage-900 dark:text-cream-50">{form.name}</h2>
              {form.category && (
                <span className="mt-2 inline-block rounded-full bg-sage-100 px-3 py-1 text-sm font-medium text-sage-800 capitalize dark:bg-sage-700 dark:text-sage-100">
                  {form.category}
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {form.phone && (
                <p>
                  <span className="font-medium text-ink dark:text-cream-50">📞</span> <a href={`tel:${form.phone}`} className="text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50">{form.phone}</a>
                </p>
              )}
              {form.website && (
                <p>
                  <span className="font-medium text-ink dark:text-cream-50">🔗</span> <a href={form.website} target="_blank" rel="noopener noreferrer" className="text-sage-700 hover:text-sage-900 hover:underline dark:text-sage-300 dark:hover:text-cream-50">{form.website}</a>
                </p>
              )}
              {(form.instagram_handle || form.facebook_handle || form.tiktok_handle) && (
                <div>
                  <p className="font-medium text-ink dark:text-cream-50 mb-1">Follow:</p>
                  <div className="space-y-1 text-sage-700 dark:text-sage-300">
                    {form.instagram_handle && <p>📸 @{form.instagram_handle}</p>}
                    {form.facebook_handle && <p>👥 {form.facebook_handle}</p>}
                    {form.tiktok_handle && <p>🎵 @{form.tiktok_handle}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Information Section */}
      <div className="border-b border-border p-6 dark:border-sage-700">
        <h3 className="mb-4 font-display text-lg font-semibold text-sage-900 dark:text-cream-50">Edit Information</h3>

        <div className="flex flex-col gap-5">
          <Input
            label="Business name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Textarea
            label="Description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium text-ink dark:text-cream-50">Category</label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as VendorCategory })}
              className="min-h-touch rounded-card border border-border bg-surface px-3 text-base text-ink dark:bg-sage-800 dark:text-cream-50 dark:border-sage-700"
              suppressHydrationWarning
            >
              {VENDOR_CATEGORY.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Input label="Website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />

          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <div>
            <h4 className="mb-3 text-sm font-medium text-ink dark:text-cream-50">Social Media</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Instagram" placeholder="@handle" value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} />
              <Input label="Facebook" placeholder="page name" value={form.facebook_handle} onChange={(e) => setForm({ ...form, facebook_handle: e.target.value })} />
              <Input label="TikTok" placeholder="@handle" value={form.tiktok_handle} onChange={(e) => setForm({ ...form, tiktok_handle: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Photos Section */}
      <div className="border-b border-border p-6 dark:border-sage-700">
        <h3 className="mb-4 font-display text-lg font-semibold text-sage-900 dark:text-cream-50">Your Photos</h3>
        <p className="mb-4 text-sm text-muted dark:text-sage-300">Help customers recognize you and learn about your business.</p>

        <div className="flex flex-col gap-6">
          {/* Owner Photo */}
          <div>
            <h4 className="mb-3 font-medium text-ink dark:text-cream-50">Owner/Team Photo</h4>
            {ownerPhotoUrl && (
              <div className="mb-4 overflow-hidden rounded-card bg-sage-50 p-4 dark:bg-sage-800" style={{ maxWidth: '300px' }}>
                <Image
                  src={ownerPhotoUrl}
                  alt="Owner/team"
                  width={300}
                  height={300}
                  className="h-auto w-full rounded-card object-contain"
                />
              </div>
            )}
            <ImageUploadField
              label={ownerPhotoUrl ? 'Update photo' : 'Add photo'}
              hint="Portrait photo of you or your team."
              currentImageUrl={ownerPhotoUrl}
              onImageUrlChange={setOwnerPhotoUrl}
              isLoading={saving}
              storagePath="vendor-owner-photos"
            />
          </div>

          {/* Featured Photo */}
          <div>
            <h4 className="mb-3 font-medium text-ink dark:text-cream-50">Featured Product/Booth Photo</h4>
            {featuredPhotoUrl && (
              <div className="mb-4 overflow-hidden rounded-card bg-sage-50 p-4 dark:bg-sage-800" style={{ maxWidth: '400px' }}>
                <Image
                  src={featuredPhotoUrl}
                  alt="Featured products"
                  width={400}
                  height={300}
                  className="h-auto w-full rounded-card object-contain"
                />
              </div>
            )}
            <ImageUploadField
              label={featuredPhotoUrl ? 'Update photo' : 'Add photo'}
              hint="Your best product or booth setup."
              currentImageUrl={featuredPhotoUrl}
              onImageUrlChange={setFeaturedPhotoUrl}
              isLoading={saving}
              storagePath="vendor-product-photos"
            />
          </div>
        </div>
      </div>

      {/* Messages and Submit */}
      <div className="flex flex-col gap-3 p-6">
        {error ? <p role="alert" className="text-sm text-terracotta-700 dark:text-terracotta-400">❌ {error}</p> : null}
        {savedMsg ? <p className="text-sm text-sage-800 dark:text-sage-200">✓ {savedMsg}</p> : null}
        <Button type="submit" loading={saving}>Save changes</Button>
      </div>
    </form>
  );
}
