'use client';

import Link from 'next/link';

/**
 * Full-screen overlay modal indicating the map is under construction.
 * Prevents interaction with the map and provides a "Back to Home" button.
 */
export function ConstructionModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-lg">
        <div className="mb-4 text-4xl">🚧</div>
        <h1 className="mb-2 font-display text-2xl font-semibold text-sage-900">Under Construction</h1>
        <p className="mb-6 text-muted">
          The vendor map is being improved and will be available soon. Thank you for your patience!
        </p>
        <Link
          href="/"
          className="inline-flex min-h-touch min-w-[120px] items-center justify-center rounded-card bg-sage-700 px-4 py-2 font-medium text-cream-50 shadow-button transition hover:bg-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-300"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
