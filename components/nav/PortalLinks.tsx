'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';

interface PortalLinksProps {
  user: User | null;
  className?: string;
  /** Emphasize admin link (e.g. in vendor header). */
  variant?: 'header' | 'footer';
}

/**
 * Profile dropdown menu for authenticated users with links to vendor/admin portals.
 */
export function PortalLinks({ user, className = '', variant = 'header' }: PortalLinksProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      setOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      setSigningOut(false);
    }
  };

  if (!user) {
    if (variant === 'footer') return null;
    return (
      <Link
        href="/login"
        className={`inline-flex min-h-touch items-center rounded px-3 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 dark:text-terracotta-400 dark:hover:bg-terracotta-950 ${className}`}
      >
        Sign in
      </Link>
    );
  }

  // Header variant: compact profile dropdown
  if (variant === 'header') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex min-h-touch items-center gap-2 rounded px-3 text-sm font-medium text-ink hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800 transition"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span>👤</span>
          <span className="hidden sm:inline">Profile</span>
          <svg
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-card border border-border bg-surface shadow-card dark:bg-sage-900 dark:border-sage-700">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-muted dark:text-sage-400">
                {user.email}
              </div>
              <hr className="my-2 border-border dark:border-sage-700" />
              <Link
                href="/vendor/dashboard"
                className="block min-h-touch rounded px-3 py-2 text-sm font-medium text-ink hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800 transition"
                onClick={() => setOpen(false)}
              >
                Vendor portal
              </Link>
              {isAdmin(user) && (
                <Link
                  href="/admin/dashboard"
                  className="block min-h-touch rounded px-3 py-2 text-sm font-medium text-ink hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800 transition"
                  onClick={() => setOpen(false)}
                >
                  Admin portal
                </Link>
              )}
              <hr className="my-2 border-border dark:border-sage-700" />
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full text-left block min-h-touch rounded px-3 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 dark:text-terracotta-400 dark:hover:bg-terracotta-950 transition disabled:opacity-60"
              >
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Footer variant: simple links
  if (variant === 'footer') {
    return (
      <div className={`flex flex-wrap items-center gap-4 ${className}`}>
        <Link href="/vendor/dashboard" className="hover:text-sage-800 dark:hover:text-cream-50">
          Vendor portal
        </Link>
        {isAdmin(user) && (
          <Link href="/admin/dashboard" className="hover:text-sage-800 dark:hover:text-cream-50">
            Admin portal
          </Link>
        )}
      </div>
    );
  }

  // Mobile menu variant: stacked links
  return (
    <div className={className}>
      <Link
        href="/vendor/dashboard"
        className="block min-h-touch rounded px-3 py-2 text-sm font-medium text-ink hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800 transition"
      >
        Vendor portal
      </Link>
      {isAdmin(user) && (
        <Link
          href="/admin/dashboard"
          className="block min-h-touch rounded px-3 py-2 text-sm font-medium text-ink hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800 transition"
        >
          Admin portal
        </Link>
      )}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full text-left block min-h-touch rounded px-3 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 dark:text-terracotta-400 dark:hover:bg-terracotta-950 transition disabled:opacity-60"
      >
        {signingOut ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  );
}
