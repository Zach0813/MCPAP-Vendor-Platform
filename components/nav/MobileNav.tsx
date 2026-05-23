'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { PortalLinks } from './PortalLinks';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/feed', label: 'Feed' },
  { href: '/faq', label: 'FAQ' },
  { href: '/apply', label: 'Apply' },
] as const;

interface MobileNavProps {
  user: User | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Don't close if clicking on the button or inside the menu
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    // Only add listener if menu is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu when navigating
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded text-ink dark:text-cream-50"
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          className="absolute right-4 mt-2 flex w-56 flex-col rounded-card border border-border bg-surface shadow-card dark:bg-sage-900 dark:border-sage-700 z-40"
        >
          <ul className="p-2 flex flex-col">
            <li className="border-b border-border pb-2 mb-2 dark:border-sage-700">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="block min-h-touch rounded px-3 py-2 text-sm font-medium font-semibold text-sage-700 hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800"
              >
                ← Home
              </Link>
            </li>
            {NAV.slice(1).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
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
        </div>
      )}
    </div>
  );
}
