"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import { createNote, fetchNotes, fetchTasks, searchNotes } from "@/services/notes-api";
import type { AggregatedTask, Note, NoteFormValues } from "@/types/note";

import { CommandPalette } from "./command-palette";
import { NoteInput } from "./note-input";
import { NoteDetailPanel } from "./note-detail-panel";
import { SearchBox } from "./search-box";
import { SearchResults } from "./search-results";
import { SectionCard } from "./section-card";
import { TagBadge } from "./tag-badge";
import { TaskList } from "./task-list";
import { TimelineList } from "./timeline-list";

const featuredTags = ["learning", "ideas", "tasks"];
const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_LOADING_DELAY_MS = 180;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function NotesDashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<AggregatedTask[]>([]);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [showSearchLoading, setShowSearchLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const searchRequestId = useRef(0);

  useEffect(() => {
    async function loadNotes() {
      try {
        setIsNotesLoading(true);
        setNotesError(null);
        const loadedNotes = await fetchNotes();
        startTransition(() => {
          setNotes(loadedNotes);
          setSelectedNoteId((currentSelectedNoteId) =>
            currentSelectedNoteId && loadedNotes.some((note) => note.id === currentSelectedNoteId)
              ? currentSelectedNoteId
              : loadedNotes[0]?.id ?? null,
          );
        });
      } catch (loadError) {
        setNotesError(loadError instanceof Error ? loadError.message : "Failed to load notes.");
      } finally {
        setIsNotesLoading(false);
      }
    }

    void loadNotes();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      try {
        setIsTasksLoading(true);
        setTasksError(null);
        const loadedTasks = await fetchTasks();
        startTransition(() => {
          setTasks(loadedTasks);
        });
      } catch (loadError) {
        setTasksError(loadError instanceof Error ? loadError.message : "Failed to load tasks.");
      } finally {
        setIsTasksLoading(false);
      }
    }

    void loadTasks();
  }, []);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (event.key !== "/") {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      const searchInput = document.getElementById("search");
      if (!(searchInput instanceof HTMLInputElement)) {
        return;
      }

      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim();

    if (!normalizedQuery) {
      setSearchResults([]);
      setSearchError(null);
      setShowSearchLoading(false);
      return;
    }

    const currentRequestId = searchRequestId.current + 1;
    searchRequestId.current = currentRequestId;
    let loadingIndicatorTimeoutId: number | null = null;

    async function loadSearchResults() {
      try {
        setShowSearchLoading(false);
        setSearchError(null);
        loadingIndicatorTimeoutId = window.setTimeout(() => {
          if (searchRequestId.current === currentRequestId) {
            setShowSearchLoading(true);
          }
        }, SEARCH_LOADING_DELAY_MS);
        const results = await searchNotes(normalizedQuery);
        if (searchRequestId.current !== currentRequestId) {
          return;
        }
        startTransition(() => {
          setSearchResults(results);
        });
      } catch (loadError) {
        if (searchRequestId.current !== currentRequestId) {
          return;
        }
        setSearchError(loadError instanceof Error ? loadError.message : "Failed to search notes.");
      } finally {
        if (loadingIndicatorTimeoutId !== null) {
          window.clearTimeout(loadingIndicatorTimeoutId);
        }
        if (searchRequestId.current === currentRequestId) {
          setShowSearchLoading(false);
        }
      }
    }

    void loadSearchResults();

    return () => {
      if (loadingIndicatorTimeoutId !== null) {
        window.clearTimeout(loadingIndicatorTimeoutId);
      }
    };
  }, [debouncedQuery]);

  async function handleCreateNote(values: NoteFormValues) {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const createdNote = await createNote(values);
      startTransition(() => {
        setNotes((currentNotes) => [createdNote, ...currentNotes]);
        setSelectedNoteId(createdNote.id);
      });

      try {
        const refreshedTasks = await fetchTasks();
        startTransition(() => {
          setTasks(refreshedTasks);
        });
        setTasksError(null);
      } catch (loadError) {
        setTasksError(loadError instanceof Error ? loadError.message : "Failed to refresh tasks.");
      }

      const normalizedQuery = debouncedQuery.trim().toLowerCase();
      if (normalizedQuery) {
        const searchableText = [createdNote.title ?? "", createdNote.content, createdNote.tags.join(" ")]
          .join(" ")
          .toLowerCase();
        if (searchableText.includes(normalizedQuery)) {
          startTransition(() => {
            setSearchResults((currentResults) => [createdNote, ...currentResults]);
          });
        }
      }
    } catch (submitError) {
      setSubmitError(submitError instanceof Error ? submitError.message : "Failed to save note.");
      throw submitError;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenNote(noteId: string) {
    setSelectedNoteId(noteId);
    const noteElement = document.getElementById(`note-${noteId}`);
    noteElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const selectedNote =
    notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null;

  return (
    <>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNote={handleOpenNote}
      />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                Personal Knowledge System
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-[1.02] text-[var(--text)] sm:text-5xl lg:text-6xl">
                Capture thoughts fast. Turn raw notes into a usable memory.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-soft)] sm:text-lg">
                SECOND BRAIN keeps quick notes, organizes them into tags, surfaces
                action items, and lays everything out on a simple timeline.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {featuredTags.map((tag) => (
                  <TagBadge key={tag} label={tag} />
                ))}
              </div>
            </div>
            <div className="rounded-[30px] border border-white/40 bg-[linear-gradient(135deg,rgba(15,118,110,0.1),rgba(217,119,6,0.08))] p-5">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-white/50 bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                    Notes stored
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-[var(--text)]">
                    {isNotesLoading ? "--" : notes.length}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/50 bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                    Open tasks
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-[var(--text)]">
                    {isTasksLoading ? "--" : tasks.length}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/50 bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                    Search speed
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-[var(--text)]">&lt;1s</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {notesError || tasksError || searchError || submitError ? (
          <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-800">
            {submitError ?? notesError ?? tasksError ?? searchError}
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-6">
            <SectionCard eyebrow="Capture" title="Quick Capture">
              <NoteInput isSubmitting={isSubmitting} onSubmit={handleCreateNote} />
            </SectionCard>
            <SectionCard eyebrow="Timeline" title="Recent Notes">
              {isNotesLoading ? (
                <p className="text-sm text-[var(--text-soft)]">Loading notes...</p>
              ) : (
                <TimelineList
                  notes={notes}
                  selectedNoteId={selectedNoteId}
                  onOpenNote={handleOpenNote}
                />
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            {selectedNote ? (
              <SectionCard eyebrow="Detail" title="Selected Note">
                <NoteDetailPanel note={selectedNote} />
              </SectionCard>
            ) : null}
            <SectionCard eyebrow="Search" title="Find Notes Instantly">
              <div className="space-y-4">
                <SearchBox query={query} onQueryChange={setQuery} />
                {showSearchLoading ? (
                  <p className="text-sm text-[var(--text-soft)]">Searching notes...</p>
                ) : (
                  <SearchResults
                    query={query}
                    notes={searchResults}
                    onOpenNote={handleOpenNote}
                  />
                )}
              </div>
            </SectionCard>
            <SectionCard eyebrow="Tasks" title="Extracted Action Items">
              {isTasksLoading ? (
                <p className="text-sm text-[var(--text-soft)]">Loading tasks...</p>
              ) : (
                <TaskList tasks={tasks} />
              )}
            </SectionCard>
          </div>
        </section>
      </main>
    </>
  );
}
