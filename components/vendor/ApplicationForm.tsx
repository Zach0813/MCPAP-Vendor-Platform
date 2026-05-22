'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema, type ApplicationInput } from '@/lib/validation/application';
import { VENDOR_CATEGORY } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from './ImageUploadField';

export function ApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [ownerPhotoUrl, setOwnerPhotoUrl] = useState<string | null>(null);
  const [featuredPhotoUrl, setFeaturedPhotoUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({ resolver: zodResolver(applicationSchema) });

  async function onSubmit(values: ApplicationInput) {
    setServerError(null);
    try {
      const payload = {
        ...values,
        logoUrl,
        ownerPhotoUrl,
        featuredPhotoUrl,
      };
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Submission failed.');
    }
  }

  if (submitted) {
    return (
      <div className="rounded-card bg-sage-50 p-6 text-center dark:bg-sage-900">
        <p className="font-display text-lg font-semibold text-sage-800 dark:text-cream-50">Application received!</p>
        <p className="mt-2 text-sm text-muted dark:text-sage-300">
          We’ve sent a confirmation to your email and the organizing team has been notified.
          Expect to hear back within 2 weeks.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Business name"
          required
          autoComplete="organization"
          {...register('vendorName')}
          error={errors.vendorName?.message}
        />
        <Input
          label="Your name"
          required
          autoComplete="name"
          {...register('contactName')}
          error={errors.contactName?.message}
        />
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          {...register('phone')}
          error={errors.phone?.message}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-ink dark:text-cream-50">
          Category<span aria-hidden="true" className="ml-0.5 text-terracotta-600">*</span>
        </label>
        <select
          id="category"
          required
          {...register('category')}
          className="min-h-touch rounded-card border border-border bg-surface px-3 text-base text-ink dark:bg-sage-800 dark:text-cream-50 dark:border-sage-700"
        >
          <option value="">— Pick one —</option>
          {VENDOR_CATEGORY.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category ? (
          <p role="alert" className="text-sm text-terracotta-700 dark:text-terracotta-400">{errors.category.message}</p>
        ) : null}
      </div>

      <Textarea
        label="Tell us about your business"
        required
        rows={5}
        hint="What do you sell? What makes your booth special? 20–2000 characters."
        {...register('businessDescription')}
        error={errors.businessDescription?.message}
      />

      <Input
        label="Website (optional)"
        type="url"
        placeholder="https://"
        {...register('website')}
        error={errors.website?.message}
      />

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-medium text-ink dark:text-cream-50">Social handles (optional)</legend>
        <Input label="Instagram" placeholder="@yourhandle" {...register('socialLinks.instagram')} />
        <Input label="Facebook" placeholder="page name or URL" {...register('socialLinks.facebook')} />
        <Input label="TikTok" placeholder="@yourhandle" {...register('socialLinks.tiktok')} />
      </fieldset>

      <hr className="border-border dark:border-sage-700" />

      <fieldset className="flex flex-col gap-5">
        <legend className="text-sm font-medium text-ink dark:text-cream-50">Photos (optional)</legend>
        <p className="text-sm text-muted dark:text-sage-300">
          Upload photos to help customers recognize your booth and products. All photos help with event planning and promotion.
        </p>

        <ImageUploadField
          label="Business logo"
          hint="Shown on vendor list and map. Square format works best (e.g., 500×500px)."
          currentImageUrl={logoUrl}
          onImageUrlChange={setLogoUrl}
          isLoading={isSubmitting}
          storagePath="vendor-logos"
        />

        <ImageUploadField
          label="Owner/operator photo"
          hint="A portrait photo of you or your team. Helps customers connect with your business."
          currentImageUrl={ownerPhotoUrl}
          onImageUrlChange={setOwnerPhotoUrl}
          isLoading={isSubmitting}
          storagePath="vendor-owner-photos"
        />

        <ImageUploadField
          label="Featured product photo"
          hint="Your best product or booth setup. This is often the first thing customers see."
          currentImageUrl={featuredPhotoUrl}
          onImageUrlChange={setFeaturedPhotoUrl}
          isLoading={isSubmitting}
          storagePath="vendor-product-photos"
        />
      </fieldset>

      {serverError ? (
        <p role="alert" className="rounded border border-terracotta-300 bg-terracotta-50 p-3 text-sm text-terracotta-800 dark:border-terracotta-700 dark:bg-terracotta-950 dark:text-terracotta-200">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={isSubmitting}>
        Submit application
      </Button>
    </form>
  );
}
