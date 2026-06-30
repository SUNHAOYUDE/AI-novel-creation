import type { FeatureStatus } from "@/shared/types";
import { FeatureStatusBadge } from "@/shared/ui/FeatureStatusBadge";

type FeatureStatusNoticeProps = {
  status: FeatureStatus;
  title: string;
  description: string;
};

export function FeatureStatusNotice({ status, title, description }: FeatureStatusNoticeProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-base font-medium text-white">{title}</h3>
        <FeatureStatusBadge status={status} />
      </div>
      <p className="mt-3 text-sm text-mist/65">{description}</p>
    </div>
  );
}
