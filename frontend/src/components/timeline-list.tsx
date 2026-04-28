import type { Note } from "@/types/note";

import { NoteCard } from "./note-card";

type TimelineListProps = {
  notes: Note[];
  selectedNoteId?: string | null;
  onOpenNote: (noteId: string) => void;
};

export function TimelineList({ notes, selectedNoteId = null, onOpenNote }: TimelineListProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--canvas)] p-6 text-sm leading-6 text-[var(--text-soft)]">
        No pages yet. Create your first note to start building the workspace.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelected={note.id === selectedNoteId}
          onOpenNote={onOpenNote}
        />
      ))}
    </div>
  );
}
