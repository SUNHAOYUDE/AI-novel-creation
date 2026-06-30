import type { FeatureStatus } from "@/shared/types";

type FeatureStatusBadgeProps = {
  status: FeatureStatus;
  compact?: boolean;
};

const statusMap: Record<FeatureStatus, { label: string; className: string }> = {
  implemented: {
    label: "已实现",
    className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
  },
  in_progress: {
    label: "建设中",
    className: "border-amber-400/30 bg-amber-500/10 text-amber-200"
  },
  planned: {
    label: "未实现",
    className: "border-white/15 bg-white/[0.04] text-mist/70"
  }
};

export function FeatureStatusBadge({ status, compact = false }: FeatureStatusBadgeProps) {
  const config = statusMap[status];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-medium",
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        config.className
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}
