import type { Note } from "@/types/note";
import { formatTimelineDate } from "@/utils/notes";

import { TagBadge } from "./tag-badge";

type NoteDetailPanelProps = {
  note: Note;
};

export function NoteDetailPanel({ note }: NoteDetailPanelProps) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
        {formatTimelineDate(note.createdAt)}
      </p>
      <h3 className="mt-2 text-2xl font-semibold leading-tight text-[var(--text)]">
        {note.title ?? "Untitled note"}
      </h3>
      <p className="mt-4 text-[0.98rem] leading-7 text-[var(--text-soft)]">{note.content}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {note.tags.map((tag) => (
          <TagBadge key={tag} label={tag} />
        ))}
      </div>
      {note.tasks.length > 0 ? (
        <div className="mt-5 rounded-[20px] border border-[var(--border)] bg-white/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            Tasks In This Note
          </p>
          <div className="mt-3 space-y-2">
            {note.tasks.map((task) => (
              <p key={task.text} className="text-sm leading-6 text-[var(--text)]">
                {task.text}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
