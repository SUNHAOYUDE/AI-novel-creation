import { bookWorkspaceNavItems, globalNavItems } from "@/app/routes";
import { stats } from "@/mocks/data";
import { FeatureStatusBadge } from "@/shared/ui/FeatureStatusBadge";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatCard } from "@/shared/ui/StatCard";

export function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="创作工作台"
        description="这里是整个系统壳子的入口页，负责承接模块跳转、系统概览和后续的工作流入口。"
        actionLabel="预留新建作品入口"
        status="in_progress"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </section>

      <SectionCard title="全局入口" description="先从作品管理进入某本书，再在书内工作区处理背景故事、大纲、角色、伏笔和章节。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {globalNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.path} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
                  <Icon size={18} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-medium text-white">{item.label}</h3>
                  <FeatureStatusBadge status={item.status} compact />
                </div>
                <p className="mt-2 text-sm text-mist/65">{item.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.28em] text-mist/40">{item.path}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="书内模块层级" description="打开某本书后，将进入这本书专属的分层工作区。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bookWorkspaceNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.path} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
                  <Icon size={18} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-medium text-white">{item.label}</h3>
                  <FeatureStatusBadge status={item.status} compact />
                </div>
                <p className="mt-2 text-sm text-mist/65">{item.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.28em] text-mist/40">/books/:bookId/{item.path}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
