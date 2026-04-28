import { useEffect, useState } from "react";

import type { Note, NoteFormValues } from "@/types/note";
import { formatTimelineDate } from "@/utils/notes";

import { TagBadge } from "./tag-badge";

type NoteDetailPanelProps = {
  note: Note;
  isSaving?: boolean;
  isDeleting?: boolean;
  onUpdate: (values: NoteFormValues) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function NoteDetailPanel({
  note,
  isSaving = false,
  isDeleting = false,
  onUpdate,
  onDelete,
}: NoteDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(note.title ?? "");
    setContent(note.content);
    setIsEditing(false);
    setError(null);
  }, [note.id, note.title, note.content]);

  async function handleSubmit() {
    if (!content.trim()) {
      setError("Write a note before saving.");
      return;
    }

    setError(null);
    try {
      await onUpdate({
        title: title.trim(),
        content: content.trim(),
      });
      setIsEditing(false);
    } catch {
      setError("The note could not be updated. Try again.");
    }
  }

  async function handleDelete() {
    setError(null);
    try {
      await onDelete();
    } catch {
      setError("The note could not be deleted. Try again.");
    }
  }

  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--canvas)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
            {formatTimelineDate(note.createdAt)}
          </span>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
            {note.tasks.length} tasks
          </span>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
            {note.relatedNotes.length} linked
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setTitle(note.title ?? "");
                  setContent(note.content);
                  setIsEditing(false);
                  setError(null);
                }}
                className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)] transition hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSaving}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-4 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled note"
            className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)] outline-none"
          />
          <textarea
            rows={8}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[0.98rem] leading-8 text-[var(--text)] outline-none"
          />
          {error ? <p className="text-sm font-semibold text-amber-700">{error}</p> : null}
        </div>
      ) : (
        <>
          <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--text)]">
            {note.title ?? "Untitled note"}
          </h3>
          <p className="mt-4 text-[0.98rem] leading-8 text-[var(--text-soft)]">{note.content}</p>
        </>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {note.tags.map((tag) => (
          <TagBadge key={tag} label={tag} />
        ))}
      </div>
      {note.tasks.length > 0 ? (
        <div className="mt-6 rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
            Tasks in this page
          </p>
          <div className="mt-3 space-y-2">
            {note.tasks.map((task) => (
              <div key={task.text} className="flex items-start gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--canvas)] px-3 py-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
                <p className="text-sm leading-6 text-[var(--text)]">{task.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
