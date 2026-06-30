type StatusBadgeProps = {
  children: string;
};

export function StatusBadge({ children }: StatusBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist/80">
      {children}
    </span>
  );
}
