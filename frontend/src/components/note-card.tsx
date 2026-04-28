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
      onClick={() => onOpenNote?.(note.id)}
      className={`cursor-pointer rounded-[26px] border bg-[var(--surface-strong)] p-5 text-left shadow-[var(--shadow-soft)] ${
        isSelected
          ? "border-[var(--accent)] bg-[var(--canvas)]"
          : "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--canvas)]"
      }`}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_110px_110px] md:items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)]">
            {formatTimelineDate(note.createdAt)}
          </p>
          <h3 className="mt-2 text-left text-lg font-semibold leading-snug text-[var(--text)]">
            {note.title ?? "Untitled note"}
          </h3>
          <p className="mt-3 text-left text-sm leading-7 text-[var(--text-soft)]">
            {note.content}
          </p>
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
            Tasks
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--text)]">{note.tasks.length}</p>
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
            Links
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--text)]">{note.relatedNotes.length}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {note.tags.map((tag) => (
          <TagBadge key={tag} label={tag} />
        ))}
      </div>
      {note.relatedNotes.length > 0 ? (
        <div className="mt-6 rounded-[20px] border border-[var(--border)] bg-[var(--canvas)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
            Related pages
          </p>
          <div className="mt-3 grid gap-3">
            {note.relatedNotes.map((relatedNote) => (
              <button
                key={relatedNote.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenNote?.(relatedNote.id);
                }}
                className="block w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] p-3 text-left transition hover:border-[var(--accent)]"
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
