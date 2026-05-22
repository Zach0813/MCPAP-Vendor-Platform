'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: pipe to an error monitoring service (Sentry, Vercel Analytics, etc.)
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-prose-narrow flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted">
        We hit a snag rendering this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex min-h-touch items-center justify-center rounded-card bg-sage-700 px-6 text-cream-50 transition hover:bg-sage-800"
      >
        Try again
      </button>
      {error.digest ? (
        <p className="mt-4 text-xs text-muted">Error ID: {error.digest}</p>
      ) : null}
    </main>
  );
}
