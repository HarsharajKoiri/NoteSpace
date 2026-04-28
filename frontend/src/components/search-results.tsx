import type { Note } from "@/types/note";

type SearchResultsProps = {
  query: string;
  notes: Note[];
  onOpenNote: (noteId: string) => void;
};

export function SearchResults({ query, notes, onOpenNote }: SearchResultsProps) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--canvas)] p-4 text-sm text-[var(--text-soft)]">
        Search by note title, body text, or tag. Results open directly into the workspace.
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--canvas)] p-4 text-sm leading-6 text-[var(--text-soft)]">
        No notes matched <span className="font-semibold text-[var(--text)]">"{normalizedQuery}"</span>.
        Try a different keyword or search by a recurring tag.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
        {notes.length} result{notes.length === 1 ? "" : "s"} for "{normalizedQuery}"
      </p>
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => onOpenNote(note.id)}
          className="block w-full rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--canvas)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {note.title ?? "Untitled note"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{note.content}</p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
              {note.tags.length} tags
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
