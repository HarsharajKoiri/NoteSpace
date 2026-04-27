import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export function SectionCard({ title, eyebrow, children }: SectionCardProps) {
  return (
    <section className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight text-[var(--text)]">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
