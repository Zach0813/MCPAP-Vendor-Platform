'use client';

import { useEffect } from 'react';

/**
 * DOM id Curator looks for — must match the `container` selector in your feed's
 * published embed (e.g. #curator-feed-default-feed-layout in the dashboard snippet).
 */
const CURATOR_CONTAINER_ID = 'curator-feed-default-feed-layout';

/**
 * Curator.io embed. Loads the script lazily and mounts the feed div.
 * Replace NEXT_PUBLIC_CURATOR_FEED_ID with your real feed ID.
 */
export function CuratorFeed() {
  const feedId = process.env.NEXT_PUBLIC_CURATOR_FEED_ID;

  useEffect(() => {
    if (!feedId || feedId.startsWith('YOUR-')) return;

    const scriptId = `curator-script-${feedId}`;
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://cdn.curator.io/published/${feedId}.js`;
    script.async = true;
    document.body.appendChild(script);
  }, [feedId]);

  if (!feedId || feedId.startsWith('YOUR-')) {
    return (
      <div className="rounded-card border border-dashed border-border p-12 text-center text-muted">
        Social feed is not yet configured. Set <code className="rounded bg-sage-100 px-1">NEXT_PUBLIC_CURATOR_FEED_ID</code> in <code className="rounded bg-sage-100 px-1">.env.local</code>.
      </div>
    );
  }

  return (
    <div id={CURATOR_CONTAINER_ID} data-feed-id={feedId}>
      <a href="https://curator.io" target="_blank" rel="noopener noreferrer" className="crt-logo">
        Powered by Curator.io
      </a>
    </div>
  );
}
