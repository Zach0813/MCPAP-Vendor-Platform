'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@/lib/supabase/client';

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? location.origin;
      const { error: e2 } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (e2) throw e2;
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send magic link.';
      if (/rate limit/i.test(message)) {
        setError(
          'Email rate limit reached — do not retry this button. Run node scripts/dev-magic-link.mjs with your email and open that URL in the browser (no email is sent).'
        );
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-card bg-sage-50 p-4 text-center dark:bg-sage-800">
        <p className="font-medium text-sage-800 dark:text-cream-50">Check your email</p>
        <p className="mt-1 text-sm text-muted dark:text-sage-300">
          We just sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error ?? undefined}
      />
      <Button type="submit" loading={submitting}>Send me a magic link</Button>
    </form>
  );
}
