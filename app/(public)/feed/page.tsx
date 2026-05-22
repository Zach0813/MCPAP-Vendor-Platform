import type { Metadata } from 'next';
import { CuratorFeed } from '@/components/CuratorFeed';

export const metadata: Metadata = {
  title: 'Social Feed',
};

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">Social Feed</h1>
        <p className="mt-2 text-muted dark:text-sage-300">
          Tagged posts and updates pulled from our social accounts.
        </p>
      </header>
      <CuratorFeed />
    </div>
  );
}
