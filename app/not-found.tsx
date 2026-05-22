import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-prose-narrow flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-display text-7xl font-semibold text-sage-700">404</p>
      <h1 className="mt-4 text-2xl font-semibold">This patch is empty</h1>
      <p className="mt-2 text-muted">
        We can’t find the page you’re looking for. Maybe it was repotted somewhere else.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-touch items-center justify-center rounded-card bg-sage-700 px-6 text-cream-50 transition hover:bg-sage-800"
      >
        Back to the homepage
      </Link>
    </main>
  );
}
