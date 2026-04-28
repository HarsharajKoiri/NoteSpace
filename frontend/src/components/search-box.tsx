type SearchBoxProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function SearchBox({ query, onQueryChange }: SearchBoxProps) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="search"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]"
        >
          Search pages
        </label>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
          / to search
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--canvas)] px-4 py-3">
        <span className="text-sm text-[var(--text-soft)]">Query</span>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search notes, ideas, tags, or tasks..."
          className="w-full border-0 bg-transparent p-0 text-base text-[var(--text)] outline-none"
        />
      </div>
    </div>
  );
}
