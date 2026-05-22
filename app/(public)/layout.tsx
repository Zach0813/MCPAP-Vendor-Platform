import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { PortalLinks } from '@/components/nav/PortalLinks';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/feed', label: 'Feed' },
  { href: '/faq', label: 'FAQ' },
  { href: '/apply', label: 'Apply' },
] as const;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur dark:bg-sage-900/90 dark:border-sage-700">
        <nav
          aria-label="Primary"
          className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          <Link
            href="/"
            className="flex min-h-touch items-center gap-2 font-display text-lg font-semibold text-sage-800 dark:text-cream-50"
          >
            <span aria-hidden="true">🌿</span>
            <span>Magic City Plant-A-Palooza</span>
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-touch items-center rounded px-3 text-sm font-medium text-ink hover:bg-sage-50 hover:text-sage-800 dark:text-cream-50 dark:hover:bg-sage-800 dark:hover:text-cream-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <PortalLinks user={user} />
          </div>
          {/* TODO: replace with proper mobile menu drawer */}
          <details className="lg:hidden">
            <summary
              className="inline-flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded text-ink dark:text-cream-50"
              aria-label="Toggle navigation"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <ul className="absolute right-4 mt-2 flex w-56 flex-col rounded-card border border-border bg-surface p-2 shadow-card dark:bg-sage-900 dark:border-sage-700">
              <li className="border-b border-border pb-2 mb-2 dark:border-sage-700">
                <Link
                  href="/"
                  className="block min-h-touch rounded px-3 py-2 text-sm font-medium font-semibold text-sage-700 hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800"
                >
                  ← Home
                </Link>
              </li>
              {NAV.slice(1).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block min-h-touch rounded px-3 py-2 text-sm font-medium hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-border pt-2 dark:border-sage-700">
                <PortalLinks user={user} className="flex flex-col items-stretch gap-0" />
              </li>
            </ul>
          </details>
        </nav>
      </header>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border bg-sage-50 dark:bg-sage-900 dark:border-sage-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted dark:text-sage-400 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Magic City Plant-A-Palooza. All rights reserved.</p>
          <div className="flex gap-4 items-center">
            <Link href="/faq" className="hover:text-sage-800 dark:hover:text-cream-50">FAQ</Link>
            <Link href="/apply" className="hover:text-sage-800 dark:hover:text-cream-50">Become a vendor</Link>
            <PortalLinks user={user} variant="footer" />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
