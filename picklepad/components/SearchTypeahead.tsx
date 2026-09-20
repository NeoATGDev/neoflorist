"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { suggest, type Suggestion } from "@/lib/search";
import type { Court } from "@/data/courts";
import { PaddleIcon, PinIcon, SearchIcon, SlidersIcon, CloseIcon } from "./Icons";

const KIND_META: Record<
  Suggestion["kind"],
  { label: string; Icon: typeof PinIcon; accent: string }
> = {
  court: { label: "Venue", Icon: PaddleIcon, accent: "text-lime-glow" },
  area: { label: "Area", Icon: PinIcon, accent: "text-teal-glow" },
  amenity: { label: "Amenity", Icon: SlidersIcon, accent: "text-ink-300" },
  tag: { label: "Tag", Icon: SlidersIcon, accent: "text-ink-300" },
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Called when the user picks a venue — the parent opens its detail sheet. */
  onPickCourt: (court: Court) => void;
  /** Called when the user picks an area suggestion. */
  onPickArea: (area: string) => void;
  placeholder?: string;
};

export default function SearchTypeahead({
  value,
  onChange,
  onPickCourt,
  onPickArea,
  placeholder = "Try “Koramangala”, “rooftop”, “Dinkyard”, “paddle rental”…",
}: Props) {
  const [draft, setDraft] = useState(value);
  const [debounced, setDebounced] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Keep the box in sync when the parent clears the query (e.g. "Reset filters").
  useEffect(() => setDraft(value), [value]);

  // Debounce so we only recompute suggestions once typing settles.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(draft), 110);
    return () => clearTimeout(t);
  }, [draft]);

  // Push the settled query up so the result list filters live as you type,
  // without waiting for Enter. Held in a ref so the effect depends only on the
  // debounced text and never re-fires because the parent re-rendered.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current(debounced);
  }, [debounced]);

  const suggestions = useMemo(() => suggest(debounced, 8), [debounced]);

  useEffect(() => setActive(0), [debounced]);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // "/" anywhere focuses the search box.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
        return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function commit(s: Suggestion) {
    setOpen(false);
    if (s.kind === "court") {
      setDraft(s.court.name);
      onChange(s.court.name);
      onPickCourt(s.court);
    } else if (s.kind === "area") {
      setDraft("");
      onChange("");
      onPickArea(s.label);
    } else {
      setDraft(s.label);
      onChange(s.label);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") onChange(draft);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(suggestions[active]!);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const showList = open && draft.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
          showList
            ? "border-lime-glow/45 bg-ink-850 shadow-[0_0_0_4px_rgba(214,255,63,0.08)]"
            : "border-white/10 bg-ink-850/80 hover:border-white/20"
        }`}
      >
        <SearchIcon className="h-5 w-5 shrink-0 text-ink-400" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search pickleball courts"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && suggestions[active] ? `${listId}-${active}` : undefined
          }
          role="combobox"
          className="w-full bg-transparent text-[15px] text-white placeholder:text-ink-400/80 focus:outline-none"
        />
        {draft ? (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-1.5 text-ink-400 transition hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded-md border border-white/12 bg-white/5 px-1.5 py-0.5 text-[11px] font-medium text-ink-400 sm:block">
            /
          </kbd>
        )}
      </div>

      {showList && (
        <div
          id={listId}
          role="listbox"
          className="glass-strong animate-pop absolute z-40 mt-2 w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
        >
          {suggestions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-400">
              Nothing matched “{draft}”. Try an area like{" "}
              <span className="text-ink-200">Indiranagar</span> or a tag like{" "}
              <span className="text-ink-200">rooftop</span>.
            </p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto py-1.5">
              {suggestions.map((s, i) => {
                const meta = KIND_META[s.kind];
                return (
                  <li key={`${s.kind}-${s.label}`}>
                    <button
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => commit(s)}
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition ${
                        i === active ? "bg-white/8" : "hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/6 ${meta.accent}`}
                      >
                        <meta.Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white capitalize">
                          {s.label}
                        </span>
                        <span className="block truncate text-xs text-ink-400">
                          {s.sub}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-400 uppercase">
                        {meta.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-white/8 px-4 py-2 text-[11px] text-ink-400">
            <span>↑↓ to move · ↵ to select · esc to close</span>
            <span>{suggestions.length} suggestions</span>
          </div>
        </div>
      )}
    </div>
  );
}
