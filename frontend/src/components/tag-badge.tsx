type TagBadgeProps = {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
};

export function TagBadge({ label, onClick, isActive = false }: TagBadgeProps) {
  const className = `inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
    isActive
      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
      : "bg-[var(--surface-muted)] text-[var(--text-soft)]"
  } ${onClick ? "cursor-pointer transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]" : ""}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {label}
      </button>
    );
  }

  return (
    <span className={className}>
      {label}
    </span>
  );
}
