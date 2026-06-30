import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { bookWorkspaceNavItems, globalNavItems } from "@/app/routes";
import { FeatureStatusBadge } from "@/shared/ui/FeatureStatusBadge";

function getLinkClassName(isActive: boolean) {
  return [
    "group flex items-start gap-3 rounded-2xl border px-4 py-3 transition",
    isActive
      ? "border-accent/40 bg-accent/10 text-white"
      : "border-white/10 bg-white/[0.03] text-mist/75 hover:border-white/20 hover:bg-white/[0.06]"
  ].join(" ");
}

export function AppLayout() {
  const location = useLocation();
  const isBookWorkspace = useMemo(() => /^\/books\/\d+/.test(location.pathname), [location.pathname]);
  const [showGlobalSidebar, setShowGlobalSidebar] = useState(!isBookWorkspace);

  useEffect(() => {
    setShowGlobalSidebar(!isBookWorkspace);
  }, [isBookWorkspace]);

  const allNavItems = [...globalNavItems, ...bookWorkspaceNavItems];
  const implementedCount = allNavItems.filter((item) => item.status === "implemented").length;
  const plannedCount = allNavItems.filter((item) => item.status === "planned").length;

  return (
    <div className="min-h-screen bg-transparent text-mist">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-6">
        {showGlobalSidebar ? (
          <aside className="hidden w-[300px] shrink-0 rounded-[32px] border border-white/10 bg-panel/85 p-5 shadow-panel lg:block">
          <div className="mb-8 space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-accent/80">工作台</p>
            <h1 className="text-2xl font-semibold text-white">AI 小说生成系统</h1>
            <p className="text-sm text-mist/65">沉浸式设定书：从世界观到章节，一路把作品写完。</p>
          </div>

          <nav className="space-y-3">
            {globalNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => getLinkClassName(isActive)}>
                  <span className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <FeatureStatusBadge status={item.status} compact />
                    </span>
                    <span className="block text-xs text-mist/55">{item.description}</span>
                  </span>
                </NavLink>
              );
            })}
          </nav>
          </aside>
        ) : null}

        <main className="flex-1 rounded-[32px] border border-white/10 bg-[#0c1526]/85 p-6 shadow-panel">
          <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent/70">桌面优先</p>
              <h2 className="mt-2 text-xl font-medium text-white">沉浸式创作工作台</h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {isBookWorkspace ? (
                <button
                  type="button"
                  onClick={() => setShowGlobalSidebar(true)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                >
                  展开全局导航
                </button>
              ) : null}
              {!isBookWorkspace && showGlobalSidebar ? (
                <button
                  type="button"
                  onClick={() => setShowGlobalSidebar(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                >
                  收起导航
                </button>
              ) : null}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/70">
                当前阶段：已实现 {implementedCount} 个模块，未实现 {plannedCount} 个模块
              </div>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
