import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Labeled text input. Always uses an explicit <label> for screen readers,
 * and renders an inline error message below the field.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...rest },
  ref
) {
  const inputId = id ?? `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink dark:text-cream-50">
        {label}
        {rest.required ? <span aria-hidden="true" className="ml-0.5 text-terracotta-600">*</span> : null}
      </label>
      <input
        id={inputId}
        ref={ref}
        suppressHydrationWarning
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-touch rounded-card border border-border bg-surface px-3 text-base text-ink',
          'placeholder:text-muted focus:border-sage-600 focus:outline-none',
          'dark:bg-sage-800 dark:text-cream-50 dark:border-sage-700 dark:placeholder:text-sage-400 dark:focus:border-sage-500',
          error && 'border-terracotta-500 dark:border-terracotta-500',
          className
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-terracotta-700 dark:text-terracotta-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted dark:text-sage-400">{hint}</p>
      ) : null}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className, ...rest },
  ref
) {
  const inputId = id ?? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink dark:text-cream-50">
        {label}
        {rest.required ? <span aria-hidden="true" className="ml-0.5 text-terracotta-600">*</span> : null}
      </label>
      <textarea
        id={inputId}
        ref={ref}
        suppressHydrationWarning
        rows={rest.rows ?? 4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'rounded-card border border-border bg-surface p-3 text-base text-ink',
          'placeholder:text-muted focus:border-sage-600 focus:outline-none',
          'dark:bg-sage-800 dark:text-cream-50 dark:border-sage-700 dark:placeholder:text-sage-400 dark:focus:border-sage-500',
          error && 'border-terracotta-500 dark:border-terracotta-500',
          className
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-terracotta-700 dark:text-terracotta-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted dark:text-sage-400">{hint}</p>
      ) : null}
    </div>
  );
});
