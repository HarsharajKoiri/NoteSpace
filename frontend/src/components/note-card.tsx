import type { Note } from "@/types/note";
import { formatTimelineDate } from "@/utils/notes";

import { TagBadge } from "./tag-badge";

type NoteCardProps = {
  note: Note;
  isSelected?: boolean;
  onOpenNote?: (noteId: string) => void;
};

export function NoteCard({ note, isSelected = false, onOpenNote }: NoteCardProps) {
  return (
    <article
      id={`note-${note.id}`}
      className={`rounded-[26px] border bg-[var(--surface-strong)] p-5 shadow-[var(--shadow-soft)] ${
        isSelected
          ? "border-[var(--accent)] ring-2 ring-[var(--accent-soft)]"
          : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
            {formatTimelineDate(note.createdAt)}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-snug text-[var(--text)]">
            {note.title ?? "Untitled note"}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          {note.tasks.length} tasks
        </span>
      </div>
      <p className="mt-4 text-[0.98rem] leading-7 text-[var(--text-soft)]">{note.content}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {note.tags.map((tag) => (
          <TagBadge key={tag} label={tag} />
        ))}
      </div>
      {note.relatedNotes.length > 0 ? (
        <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-white/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            Related Notes
          </p>
          <div className="mt-3 space-y-3">
            {note.relatedNotes.map((relatedNote) => (
              <button
                key={relatedNote.id}
                type="button"
                onClick={() => onOpenNote?.(relatedNote.id)}
                className="block w-full rounded-[18px] bg-white/65 p-3 text-left transition hover:bg-white/90"
              >
                <p className="text-sm font-semibold text-[var(--text)]">
                  {relatedNote.title ?? "Untitled note"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
                  {relatedNote.sharedTags.length > 0
                    ? `Shared tags: ${relatedNote.sharedTags.join(", ")}`
                    : null}
                  {relatedNote.sharedTags.length > 0 && relatedNote.sharedKeywords.length > 0
                    ? " | "
                    : null}
                  {relatedNote.sharedKeywords.length > 0
                    ? `Shared keywords: ${relatedNote.sharedKeywords.join(", ")}`
                    : null}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
