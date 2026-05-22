import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const nextPath = next ?? '/vendor/dashboard';

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-sage-50 px-4 py-12 dark:bg-sage-950">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50"
      >
        Back to home
      </Link>
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-8 shadow-card dark:bg-sage-900 dark:border-sage-700">
        <h1 className="font-display text-2xl font-semibold text-sage-900 dark:text-cream-50">Vendor & Admin Sign In</h1>
        <p className="mt-2 text-sm text-muted dark:text-sage-300">
          Enter the email tied to your vendor account. We'll email you a magic link — no password required.
        </p>
        <p className="mt-3 rounded-card bg-cream-50 p-3 text-xs text-muted dark:bg-sage-800 dark:text-sage-400">
          <strong className="text-ink dark:text-cream-50">Hit the email rate limit?</strong> Do not click &quot;Send magic link&quot; again.
          Run{' '}
          <code className="rounded bg-sage-100 px-1 dark:bg-sage-700 dark:text-cream-50">node scripts/dev-magic-link.mjs your@email.com</code> and
          open the printed URL in this browser tab only.
        </p>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded border border-terracotta-300 bg-terracotta-50 px-3 py-2 text-sm text-terracotta-800 dark:border-terracotta-700 dark:bg-terracotta-950 dark:text-terracotta-200"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-6">
          <LoginForm next={nextPath} />
        </div>
      </div>
    </main>
  );
}
