import type { FeatureStatus } from "@/shared/types";
import { FeatureStatusBadge } from "@/shared/ui/FeatureStatusBadge";

type PageHeaderProps = {
  title: string;
  description: string;
  actionLabel?: string;
  status?: FeatureStatus;
};

export function PageHeader({ title, description, actionLabel, status }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-accent/70">AI 小说创作台</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          {status ? <FeatureStatusBadge status={status} /> : null}
        </div>
        <p className="max-w-3xl text-sm text-mist/75">{description}</p>
      </div>
      {actionLabel ? (
        <button className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
