import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import type { NoteFormValues } from "@/types/note";

type NoteInputProps = {
  isSubmitting: boolean;
  onSubmit: (values: NoteFormValues) => Promise<void>;
};

const initialValues: NoteFormValues = {
  title: "",
  content: "",
};

export function NoteInput({ isSubmitting, onSubmit }: NoteInputProps) {
  const [values, setValues] = useState<NoteFormValues>(initialValues);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.content.trim()) {
      setFormError("Write a note before saving.");
      return;
    }

    setFormError(null);
    try {
      await onSubmit({
        title: values.title.trim(),
        content: values.content.trim(),
      });
      setValues(initialValues);
    } catch {
      setFormError("The note could not be saved. Check the API connection and try again.");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (!isSubmitting) {
        formRef.current?.requestSubmit();
      }
    }
  }

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[var(--shadow-soft)]">
        <label
          htmlFor="note-title"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]"
        >
          Optional title
        </label>
        <input
          id="note-title"
          type="text"
          value={values.title}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          placeholder="Name this thought"
          className="mt-3 w-full rounded-2xl border border-transparent bg-transparent px-0 py-1 text-xl font-semibold text-[var(--text)] outline-none focus:border-transparent focus:ring-0"
        />
        <div className="mt-4 h-px bg-stone-200/90" />
        <label htmlFor="note-content" className="sr-only">
          Write a note
        </label>
        <textarea
          id="note-content"
          rows={7}
          value={values.content}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              content: event.target.value,
            }))
          }
          placeholder="Capture an idea, a task, or a reflection..."
          className="mt-4 w-full resize-none rounded-2xl border border-transparent bg-transparent p-0 text-[1.02rem] leading-8 text-[var(--text)] outline-none focus:border-transparent focus:ring-0"
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-soft)]">
            Type quickly and save immediately. Voice capture will be added after the MVP.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
            Shortcut: Ctrl/Cmd + Enter to save
          </p>
          {formError ? (
            <p className="mt-2 text-sm font-semibold text-amber-700">{formError}</p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-w-[140px] items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] hover:bg-[var(--accent-strong)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isSubmitting ? "Saving..." : "Save Note"}
        </button>
      </div>
    </form>
  );
}
