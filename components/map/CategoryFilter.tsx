'use client';

import { cn } from '@/lib/utils';
import type { VendorCategory } from '@/types';

interface CategoryFilterProps {
  value: VendorCategory | 'all';
  onChange: (next: VendorCategory | 'all') => void;
  categories: ReadonlyArray<VendorCategory | 'all'>;
}

export function CategoryFilter({ value, onChange, categories }: CategoryFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter vendors by category"
      className="flex gap-2 overflow-x-auto"
    >
      {categories.map((cat) => {
        const isActive = cat === value;
        return (
          <button
            key={cat}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(cat)}
            className={cn(
              'inline-flex min-h-touch shrink-0 items-center rounded-full px-4 text-sm font-medium transition',
              isActive
                ? 'bg-sage-700 text-cream-50'
                : 'border border-sage-200 text-sage-800 hover:bg-sage-50'
            )}
          >
            {cat === 'all' ? 'All' : cat.replace('-', ' / ')}
          </button>
        );
      })}
    </div>
  );
}
