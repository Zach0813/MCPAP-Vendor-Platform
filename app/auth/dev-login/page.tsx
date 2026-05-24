'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * Dev-only login page for local testing without email verification.
 * Only accessible in development mode.
 */
export default function DevLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      // Sign in with the dev password
      const data = await response.json();
      if (data.email && data.password) {
        const supabase = createBrowserClient();

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          throw new Error(signInError.message);
        }

        // Redirect to vendor dashboard
        router.push('/vendor/dashboard');
      } else {
        throw new Error('No credentials returned from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-sage-950 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm dark:bg-sage-900 dark:border-sage-700">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-sage-900 dark:text-cream-50">
            Dev Login
          </h1>
          <p className="mt-2 text-sm text-muted dark:text-sage-300">
            ⚠️ Development only — for local testing without email verification.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            required
            disabled={loading}
          />

          {error && (
            <p role="alert" className="rounded border border-terracotta-300 bg-terracotta-50 p-3 text-sm text-terracotta-800 dark:bg-terracotta-950 dark:border-terracotta-700 dark:text-terracotta-200">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted dark:text-sage-400">
          Creates a new dev session or signs in an existing user. No email verification required. Redirects to the vendor dashboard.
        </p>
      </div>
    </div>
  );
}
