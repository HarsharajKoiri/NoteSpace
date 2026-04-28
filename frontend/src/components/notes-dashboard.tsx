"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import { createNote, deleteNote, fetchNotes, fetchTasks, searchNotes, updateNote } from "@/services/notes-api";
import type { AggregatedTask, Note, NoteFormValues } from "@/types/note";

import { CommandPalette } from "./command-palette";
import { NoteInput } from "./note-input";
import { NoteDetailPanel } from "./note-detail-panel";
import { SearchBox } from "./search-box";
import { SearchResults } from "./search-results";
import { TagBadge } from "./tag-badge";
import { TaskList } from "./task-list";
import { TimelineList } from "./timeline-list";

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_LOADING_DELAY_MS = 180;
const THEME_STORAGE_KEY = "second-brain-theme";

type ThemeMode = "light" | "dark";

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
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"home" | "notes" | "tasks" | "search">("home");
  const [theme, setTheme] = useState<ThemeMode>("light");

  const searchRequestId = useRef(0);
  const homeSectionRef = useRef<HTMLElement | null>(null);
  const notesSectionRef = useRef<HTMLDivElement | null>(null);
  const searchSectionRef = useRef<HTMLDivElement | null>(null);
  const tasksSectionRef = useRef<HTMLDivElement | null>(null);
  const noteComposerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const resolvedTheme: ThemeMode =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    setTheme(resolvedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  async function refreshWorkspace(options?: { selectedNoteId?: string | null }) {
    const nextSelectedNoteId = options?.selectedNoteId;
    const normalizedQuery = debouncedQuery.trim();

    const [loadedNotes, loadedTasks] = await Promise.all([
      fetchNotes(),
      fetchTasks(),
    ]);
    let loadedSearchResults: Note[] = [];

    if (normalizedQuery) {
      loadedSearchResults = await searchNotes(normalizedQuery);
    }

    startTransition(() => {
      setNotes(loadedNotes);
      setTasks(loadedTasks);
      setSearchResults(loadedSearchResults);
      setSelectedNoteId((currentSelectedNoteId) => {
        const preferredNoteId = nextSelectedNoteId ?? currentSelectedNoteId;
        if (preferredNoteId && loadedNotes.some((note) => note.id === preferredNoteId)) {
          return preferredNoteId;
        }
        return loadedNotes[0]?.id ?? null;
      });
    });
  }

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
      await refreshWorkspace({ selectedNoteId: createdNote.id });
      setNotesError(null);
      setTasksError(null);
      setSearchError(null);
    } catch (createError) {
      setSubmitError(createError instanceof Error ? createError.message : "Failed to save note.");
      throw createError;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateNote(values: NoteFormValues) {
    if (!selectedNoteId) {
      return;
    }

    try {
      setIsUpdatingNote(true);
      setNotesError(null);
      setTasksError(null);
      setSearchError(null);
      await updateNote(selectedNoteId, values);
      await refreshWorkspace({ selectedNoteId });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Failed to update note.";
      setNotesError(message);
      throw updateError;
    } finally {
      setIsUpdatingNote(false);
    }
  }

  async function handleDeleteSelectedNote() {
    if (!selectedNoteId) {
      return;
    }

    try {
      setIsDeletingNote(true);
      setNotesError(null);
      setTasksError(null);
      setSearchError(null);
      await deleteNote(selectedNoteId);
      await refreshWorkspace({ selectedNoteId: null });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete note.";
      setNotesError(message);
      throw deleteError;
    } finally {
      setIsDeletingNote(false);
    }
  }

  function handleOpenNote(noteId: string) {
    setSelectedNoteId(noteId);
    setActiveSection("notes");
    const noteElement = document.getElementById(`note-${noteId}`);
    noteElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function focusSearch() {
    const searchInput = document.getElementById("search");
    if (searchInput instanceof HTMLInputElement) {
      searchInput.focus();
      searchInput.select();
    }
  }

  function scrollToElement(element: HTMLElement | null) {
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNavigate(section: "home" | "notes" | "tasks" | "search") {
    setActiveSection(section);

    if (section === "home") {
      scrollToElement(homeSectionRef.current);
      noteComposerRef.current?.focus();
      return;
    }

    if (section === "notes") {
      scrollToElement(notesSectionRef.current);
      return;
    }

    if (section === "tasks") {
      scrollToElement(tasksSectionRef.current);
      return;
    }

    scrollToElement(searchSectionRef.current);
    window.setTimeout(() => {
      focusSearch();
    }, 180);
  }

  function handleTagFilter(tag: string) {
    setQuery(tag);
    setActiveSection("search");
    scrollToElement(searchSectionRef.current);
    window.setTimeout(() => {
      focusSearch();
    }, 180);
  }

  function handleThemeToggle() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null;
  const topTags = Object.entries(
    notes.reduce<Record<string, number>>((accumulator, note) => {
      note.tags.forEach((tag) => {
        accumulator[tag] = (accumulator[tag] ?? 0) + 1;
      });
      return accumulator;
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);
  const recentNotes = notes.slice(0, 3);
  const actionTasks = tasks.filter((task) => !task.completed);
  const avgTasksPerNote = notes.length > 0 ? (tasks.length / notes.length).toFixed(1) : "0.0";
  const allErrors = submitError ?? notesError ?? tasksError ?? searchError;
  const workspaceCards = [
    {
      label: "Pages",
      value: isNotesLoading ? "--" : String(notes.length),
      hint: "Linked notes across your workspace",
      onClick: () => handleNavigate("notes"),
    },
    {
      label: "Open tasks",
      value: isTasksLoading ? "--" : String(actionTasks.length),
      hint: "Action items extracted from writing",
      onClick: () => handleNavigate("tasks"),
    },
    {
      label: "Density",
      value: `${avgTasksPerNote}x`,
      hint: "Average tasks captured per note",
      onClick: () => handleNavigate("home"),
    },
  ];

  const navigationItems = [
    { key: "home" as const, label: "Home", badge: "D" },
    { key: "notes" as const, label: "All notes", badge: String(notes.length) },
    { key: "tasks" as const, label: "Tasks", badge: String(actionTasks.length) },
    { key: "search" as const, label: "Search", badge: "/" },
  ];

  return (
    <>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNote={handleOpenNote}
      />
      <main ref={homeSectionRef} className="workspace-shell min-h-screen px-3 py-3 sm:px-4 sm:py-4">
        <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-3 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
          <aside className="workspace-panel workspace-sidebar flex flex-col gap-4">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-faint)]">
                    SECOND BRAIN
                  </p>
                  <h1 className="mt-3 text-[1.65rem] font-semibold leading-tight text-[var(--text)]">
                    Knowledge workspace
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    Organize notes as living pages, not loose entries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text)]"
                >
                  <span>{theme === "light" ? "Dark" : "Light"}</span>
                  <span className="text-sm leading-none">{theme === "light" ? "◐" : "○"}</span>
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-3">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavigate(item.key)}
                    className={`flex w-full items-center justify-between rounded-[18px] px-3 py-2.5 text-left text-sm transition ${
                      activeSection === item.key
                        ? "bg-[var(--surface-muted)] font-semibold text-[var(--text)]"
                        : "text-[var(--text-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                    Top tags
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">The themes your notes cluster around.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {topTags.length > 0 ? (
                  topTags.map(([tag, count]) => (
                    <TagBadge
                      key={tag}
                      label={`${tag} ${count}`}
                      onClick={() => handleTagFilter(tag)}
                      isActive={query.trim().toLowerCase() === tag.toLowerCase()}
                    />
                  ))
                ) : (
                  <span className="text-sm text-[var(--text-soft)]">Tags will appear after your first few notes.</span>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                Shortcuts
              </p>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-soft)]">
                <div className="flex items-center justify-between gap-3">
                  <span>Open command palette</span>
                  <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text)]">
                    Ctrl K
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Jump to search</span>
                  <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text)]">
                    /
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Save draft</span>
                  <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text)]">
                    Cmd Enter
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <section className="workspace-panel flex min-h-[80vh] flex-col overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-faint)]">
                    Workspace
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text)]">
                    Notes, tasks, and context in one flow
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                    Capture raw thinking, browse it like a collection, and keep the selected page in context.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {workspaceCards.map((card) => (
                    <button
                      key={card.label}
                      type="button"
                      onClick={card.onClick}
                      className="min-w-[150px] rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                        {card.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{card.value}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{card.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {allErrors ? (
              <div className="border-b border-amber-200/70 bg-amber-50/90 px-5 py-3 text-sm font-medium text-amber-900 sm:px-6">
                {allErrors}
              </div>
            ) : null}

            <div className="grid flex-1 gap-0 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="border-b border-[var(--border)] xl:border-b-0 xl:border-r">
                <div className="space-y-5 p-5 sm:p-6">
                  <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                          Quick capture
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">
                          Draft directly into your workspace
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                          Use this as an inbox. Titles, tags, related notes, and tasks are resolved after save.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                      >
                        Open command palette
                      </button>
                    </div>
                    <div className="mt-5">
                      <NoteInput
                        isSubmitting={isSubmitting}
                        onSubmit={handleCreateNote}
                        contentRef={noteComposerRef}
                      />
                    </div>
                  </div>

                  <div ref={notesSectionRef} className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-strong)]">
                    <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                          Collection view
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-[var(--text)]">All notes</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                        <span className="rounded-full border border-[var(--border)] px-2 py-1">Table feel</span>
                        <span className="rounded-full border border-[var(--border)] px-2 py-1">Newest first</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      {isNotesLoading ? (
                        <p className="text-sm text-[var(--text-soft)]">Loading notes...</p>
                      ) : (
                        <TimelineList
                          notes={notes}
                          selectedNoteId={selectedNoteId}
                          onOpenNote={handleOpenNote}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 border-t border-[var(--border)] xl:border-t-0">
                <div ref={searchSectionRef} className="border-b border-[var(--border)] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                        Search
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-[var(--text)]">Find across the workspace</h3>
                    </div>
                    <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
                      Slash to focus
                    </span>
                  </div>
                  <div className="mt-4">
                    <SearchBox query={query} onQueryChange={setQuery} />
                  </div>
                  <div className="mt-4">
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
                </div>

                <div className="p-5 sm:p-6">
                  {selectedNote ? (
                    <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                            Selected page
                          </p>
                          <h3 className="mt-1 text-xl font-semibold text-[var(--text)]">Page preview</h3>
                        </div>
                        <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
                          Live context
                        </span>
                      </div>
                      <div className="mt-4">
                        <NoteDetailPanel
                          note={selectedNote}
                          isSaving={isUpdatingNote}
                          isDeleting={isDeletingNote}
                          onUpdate={handleUpdateNote}
                          onDelete={handleDeleteSelectedNote}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] p-5 text-sm leading-6 text-[var(--text-soft)]">
                      Select a note to inspect its content, related notes, and extracted tasks.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="workspace-panel flex flex-col gap-4">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                Focus note
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--text)]">
                {selectedNote?.title ?? "No page selected"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                {selectedNote
                  ? selectedNote.content
                  : "Open any page from the collection to see its context here."}
              </p>
              {selectedNote?.tags.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag) => (
                    <TagBadge key={tag} label={tag} />
                  ))}
                </div>
              ) : null}
            </div>

            <div ref={tasksSectionRef} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                    Action queue
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">Tasks from notes</h3>
                </div>
                <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
                  {actionTasks.length}
                </span>
              </div>
              <div className="mt-4">
                {isTasksLoading ? (
                  <p className="text-sm text-[var(--text-soft)]">Loading tasks...</p>
                ) : (
                  <TaskList tasks={tasks} onOpenNote={handleOpenNote} />
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
                Recent pages
              </p>
              <div className="mt-4 space-y-3">
                {recentNotes.length > 0 ? (
                  recentNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => handleOpenNote(note.id)}
                      className="block w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-left transition hover:border-[var(--accent)]"
                    >
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {note.title ?? "Untitled note"}
                      </p>
                      <p className="mt-1 max-h-12 overflow-hidden text-sm leading-6 text-[var(--text-soft)]">
                        {note.content}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-soft)]">Newly created pages will show up here.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
