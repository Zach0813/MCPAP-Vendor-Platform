import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { PortalLinks } from '@/components/nav/PortalLinks';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/vendors', label: 'Vendors' },
  { href: '/admin/events', label: 'Event Config' },
  { href: '/admin/gallery', label: 'Gallery & Media' },
] as const;

/**
 * Admin layout — requires the authenticated user to have the `admin` role
 * (stored as a JWT custom claim — see lib/auth.ts and migration).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/dashboard');
  }

  if (!isAdmin(user)) {
    // Logged in but JWT lacks admin role — promote via supabase/scripts/promote-admin.sql
    redirect('/vendor/dashboard?notice=not_admin');
  }

  return (
    <div className="flex min-h-screen flex-col bg-sage-50 dark:bg-sage-950">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur dark:bg-sage-900/90 dark:border-sage-700">
        <div className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-medium text-sage-700 hover:text-sage-800 dark:text-sage-300 dark:hover:text-cream-50 sm:text-sm">
              Home
            </Link>
            <span className="text-sage-300 dark:text-sage-700">/</span>
            <span className="text-sm font-semibold text-sage-800 dark:text-cream-50">Admin</span>
          </div>

          {/* Desktop nav */}
          <nav aria-label="Admin navigation" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-touch items-center rounded px-3 text-sm font-medium text-ink hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800"
              >
                {item.label}
              </Link>
            ))}
            <PortalLinks user={user} className="ml-2 border-l border-border pl-2 dark:border-sage-700" />
          </nav>

          {/* Mobile menu */}
          <details className="md:hidden">
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
                  className="block min-h-touch rounded px-3 py-2 text-sm font-semibold text-sage-700 hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800"
                >
                  Home
                </Link>
              </li>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block min-h-touch rounded px-3 py-2 text-sm font-medium text-ink hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-border pt-2 mt-2 dark:border-sage-700">
                <PortalLinks user={user} className="flex flex-col items-stretch gap-0" />
              </li>
            </ul>
          </details>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-border bg-sage-50 dark:bg-sage-900 dark:border-sage-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted dark:text-sage-400 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Magic City Plant-A-Palooza. All rights reserved.</p>
          <div className="flex gap-4 items-center">
            <Link href="/faq" className="hover:text-sage-800 dark:hover:text-cream-50">FAQ</Link>
            <Link href="/apply" className="hover:text-sage-800 dark:hover:text-cream-50">Become a vendor</Link>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
