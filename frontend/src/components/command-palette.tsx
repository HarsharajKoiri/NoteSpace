"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { searchNotes } from "@/services/notes-api";
import type { Note } from "@/types/note";

const PALETTE_DEBOUNCE_MS = 250;
const PALETTE_LOADING_DELAY_MS = 120;

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenNote: (noteId: string) => void;
};

export function CommandPalette({
  isOpen,
  onClose,
  onOpenNote,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setResults([]);
      setError(null);
      setShowLoading(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, PALETTE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const normalizedQuery = debouncedQuery.trim();
    if (!normalizedQuery) {
      setResults([]);
      setError(null);
      setShowLoading(false);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    let loadingIndicatorTimeoutId: number | null = null;

    async function loadResults() {
      try {
        setError(null);
        setShowLoading(false);
        loadingIndicatorTimeoutId = window.setTimeout(() => {
          if (requestIdRef.current === currentRequestId) {
            setShowLoading(true);
          }
        }, PALETTE_LOADING_DELAY_MS);
        const nextResults = await searchNotes(normalizedQuery);
        if (requestIdRef.current !== currentRequestId) {
          return;
        }
        startTransition(() => {
          setResults(nextResults);
        });
      } catch (loadError) {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }
        setError(
          loadError instanceof Error ? loadError.message : "Failed to search notes.",
        );
      } finally {
        if (loadingIndicatorTimeoutId !== null) {
          window.clearTimeout(loadingIndicatorTimeoutId);
        }
        if (requestIdRef.current === currentRequestId) {
          setShowLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      if (loadingIndicatorTimeoutId !== null) {
        window.clearTimeout(loadingIndicatorTimeoutId);
      }
    };
  }, [debouncedQuery, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  function handleOpen(noteId: string) {
    onOpenNote(noteId);
    onClose();
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      handleOpen(results[0].id);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/18 px-4 py-10 backdrop-blur-sm sm:py-16"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)]">
        <div
          className="border-b border-[var(--border)] px-5 py-4 sm:px-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
              Command Palette
            </p>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)] transition hover:text-[var(--text)]"
            >
              Esc
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search notes and press Enter..."
            className="mt-3 w-full border-0 bg-transparent p-0 text-lg font-semibold text-[var(--text)] outline-none placeholder:text-stone-400"
          />
        </div>
        <div
          className="max-h-[28rem] overflow-y-auto px-4 py-4 sm:px-5"
          onClick={(event) => event.stopPropagation()}
        >
          {!query.trim() ? (
            <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/55 p-4 text-sm text-[var(--text-soft)]">
              Search by note title, content, or tags. Use <span className="font-semibold">Ctrl/Cmd + K</span> to open this palette anytime.
            </div>
          ) : null}
          {showLoading ? (
            <p className="px-2 text-sm text-[var(--text-soft)]">Searching notes...</p>
          ) : null}
          {error ? (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {error}
            </div>
          ) : null}
          {!showLoading && !error && query.trim() && results.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/55 p-4 text-sm leading-6 text-[var(--text-soft)]">
              No notes matched <span className="font-semibold text-[var(--text)]">"{query.trim()}"</span>.
            </div>
          ) : null}
          {!showLoading && results.length > 0 ? (
            <div className="space-y-3">
              {results.map((note, index) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleOpen(note.id)}
                  className="block w-full rounded-[20px] border border-[var(--border)] bg-white/75 p-4 text-left shadow-[var(--shadow-soft)] transition hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {note.title ?? "Untitled note"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                        {note.content}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                      {index === 0 ? "Enter" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
