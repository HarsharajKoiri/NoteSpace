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
      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--text-soft)]">
        Enter a keyword to search notes by content or tag.
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm leading-6 text-[var(--text-soft)]">
        No notes matched <span className="font-semibold text-[var(--text)]">"{normalizedQuery}"</span>.
        Try a different keyword or search by tag like <span className="font-semibold">tasks</span> or <span className="font-semibold">learning</span>.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
        {notes.length} result{notes.length === 1 ? "" : "s"} for "{normalizedQuery}"
      </p>
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => onOpenNote(note.id)}
          className="block w-full rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-left shadow-[var(--shadow-soft)] transition hover:bg-white/90"
        >
          <p className="text-sm font-semibold text-[var(--text)]">
            {note.title ?? "Untitled note"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{note.content}</p>
        </button>
      ))}
    </div>
  );
}
