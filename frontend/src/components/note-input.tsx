import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, RefObject } from "react";

import type { NoteFormValues } from "@/types/note";

type NoteInputProps = {
  isSubmitting: boolean;
  onSubmit: (values: NoteFormValues) => Promise<void>;
  contentRef?: RefObject<HTMLTextAreaElement | null>;
};

const initialValues: NoteFormValues = {
  title: "",
  content: "",
};

export function NoteInput({ isSubmitting, onSubmit, contentRef }: NoteInputProps) {
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
      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--canvas)] p-4">
        <label
          htmlFor="note-title"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]"
        >
          Page title
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
          placeholder="Untitled"
          className="mt-2 w-full rounded-2xl border border-transparent bg-transparent px-0 py-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)] outline-none focus:border-transparent focus:ring-0"
        />
        <div className="mt-3 h-px bg-[var(--border)]" />
        <label htmlFor="note-content" className="sr-only">
          Write a note
        </label>
        <textarea
          ref={contentRef}
          id="note-content"
          rows={7}
          value={values.content}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              content: event.target.value,
            }))
          }
          placeholder="Type '/' for search, write a decision, add a task, or capture a raw idea..."
          className="mt-4 w-full resize-none rounded-2xl border border-transparent bg-transparent p-0 text-[1rem] leading-8 text-[var(--text)] outline-none focus:border-transparent focus:ring-0"
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-soft)]">
            Save a rough draft first. The workspace turns it into tags, related pages, and extracted tasks.
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
          className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : "Create page"}
        </button>
      </div>
    </form>
  );
}
