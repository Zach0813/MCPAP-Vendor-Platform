import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `cn()` — Tailwind class merger. Safe to use anywhere.
 * Example: cn('px-4', isActive && 'bg-sage-700', 'px-6')  →  'bg-sage-700 px-6'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
