'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible modal built on the native <dialog> element.
 * - ESC closes it (browser behavior).
 * - Backdrop click closes it.
 * - Focus is trapped inside while open (browser behavior).
 */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Click on backdrop = click directly on <dialog> itself, not its children.
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={cn(
        'w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-panel',
        'backdrop:bg-ink/40 backdrop:backdrop-blur-sm',
        className
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <h2 id="modal-title" className="font-display text-xl font-semibold text-sage-900">
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded text-muted hover:bg-sage-50"
        >
          ✕
        </button>
      </header>
      {children}
    </dialog>
  );
}
