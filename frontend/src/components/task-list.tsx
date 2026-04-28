import type { AggregatedTask } from "@/types/note";

type TaskListProps = {
  tasks: AggregatedTask[];
  onOpenNote?: (noteId: string) => void;
};

export function TaskList({ tasks, onOpenNote }: TaskListProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <button
          key={`${task.noteId}-${task.text}`}
          type="button"
          onClick={() => onOpenNote?.(task.noteId)}
          className={`flex w-full items-start gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--canvas)] p-4 text-left ${
            onOpenNote ? "transition hover:border-[var(--accent)] hover:bg-[var(--surface-strong)]" : ""
          }`}
          disabled={!onOpenNote}
        >
          <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          <div>
            <p className="text-sm font-semibold leading-6 text-[var(--text)]">{task.text}</p>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              From {task.noteTitle ?? "Untitled note"}
            </p>
          </div>
        </button>
      ))}
      {tasks.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--canvas)] p-4 text-sm text-[var(--text-soft)]">
          No tasks detected yet. Action-oriented sentences will appear here automatically.
        </p>
      ) : null}
    </div>
  );
}
