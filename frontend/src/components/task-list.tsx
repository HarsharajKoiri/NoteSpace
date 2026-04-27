import type { AggregatedTask } from "@/types/note";

type TaskListProps = {
  tasks: AggregatedTask[];
};

export function TaskList({ tasks }: TaskListProps) {

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={`${task.noteId}-${task.text}`}
          className="flex items-start gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow-soft)]"
        >
          <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          <div>
            <p className="text-sm font-semibold leading-6 text-[var(--text)]">{task.text}</p>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              From {task.noteTitle ?? "Untitled note"}
            </p>
          </div>
        </div>
      ))}
      {tasks.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--text-soft)]">
          No tasks detected yet. Action sentences will appear here.
        </p>
      ) : null}
    </div>
  );
}
