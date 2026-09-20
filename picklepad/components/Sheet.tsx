"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "./Icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** "right" = side drawer on desktop, "center" = centred dialog. */
  variant?: "right" | "center";
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Sheet({
  open,
  onClose,
  title,
  subtitle,
  variant = "right",
  children,
  footer,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel for keyboard and screen-reader users.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const panelPosition =
    variant === "right"
      ? "sm:ml-auto sm:h-full sm:max-w-xl sm:rounded-l-4xl sm:rounded-r-none"
      : "sm:m-auto sm:max-w-lg sm:rounded-4xl";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="animate-in-fade absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`animate-in-up glass-strong relative mt-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-4xl outline-none sm:mt-0 sm:max-h-full ${panelPosition}`}
      >
        <header className="flex shrink-0 items-start gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-balance text-lg leading-snug font-semibold text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-ink-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full border border-white/10 p-2 text-ink-300 transition hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <footer className="shrink-0 border-t border-white/8 bg-ink-900/70 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
