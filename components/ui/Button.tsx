import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sage-700 text-cream-50 hover:bg-sage-800 focus-visible:ring-sage-600 dark:bg-sage-600 dark:hover:bg-sage-700',
  secondary: 'border-2 border-sage-700 text-sage-800 hover:bg-sage-700 hover:text-cream-50 dark:border-sage-600 dark:text-cream-50 dark:hover:bg-sage-600',
  ghost: 'text-sage-800 hover:bg-sage-50 dark:text-cream-50 dark:hover:bg-sage-800',
  danger: 'bg-terracotta-600 text-cream-50 hover:bg-terracotta-700 dark:bg-terracotta-700 dark:hover:bg-terracotta-600',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-touch px-3 text-sm',
  md: 'min-h-touch px-5 text-base',
  lg: 'min-h-[52px] px-6 text-base',
};

/**
 * Accessible button — defaults to 44px min height (WCAG touch target).
 * Use `loading` for async actions; it disables the button and shows a spinner.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
});
