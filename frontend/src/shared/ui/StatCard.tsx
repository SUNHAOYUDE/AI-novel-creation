type StatCardProps = {
  label: string;
  value: string;
  hint: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-accent/40 hover:bg-white/[0.05]">
      <p className="text-sm text-mist/70">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-mist/60">{hint}</p>
    </div>
  );
}
