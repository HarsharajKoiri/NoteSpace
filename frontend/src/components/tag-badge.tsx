type TagBadgeProps = {
  label: string;
};

export function TagBadge({ label }: TagBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-stone-300/80 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
      {label}
    </span>
  );
}
