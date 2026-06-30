import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookWorkspaceNavItems, globalNavItems, getBookWorkspacePath } from "@/app/routes";
import { getWorkbenchBooks } from "@/features/books/api";
import { getSystemSettings } from "@/features/system-settings/api";
import type { SystemSettings, WorkbenchBook } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatCard } from "@/shared/ui/StatCard";

export function HomePage() {
  const [books, setBooks] = useState<WorkbenchBook[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function bootstrap() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [booksData, settingsData] = await Promise.all([getWorkbenchBooks(), getSystemSettings()]);
        setBooks(booksData);
        setSettings(settingsData);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载工作台数据失败");
      }
      finally {
        setIsLoading(false);
      }
    }

    void bootstrap();
  }, []);

  const stats = useMemo(() => {
    const configured = settings?.deepSeek.configured ?? false;

    return [
      { label: "作品数", value: String(books.length).padStart(2, "0"), hint: "从后端实时读取作品与进度" },
      { label: "模型配置", value: configured ? "已配置" : "未配置", hint: "DeepSeek 配置可在系统设置中维护" },
      { label: "书内模块", value: String(bookWorkspaceNavItems.length).padStart(2, "0"), hint: "背景、地图、时间线、大纲、角色等" },
      { label: "当前状态", value: isLoading ? "同步中" : "就绪", hint: "前端静态站点 + /api 反代已连通" }
    ];
  }, [books.length, isLoading, settings?.deepSeek.configured]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="创作工作台"
        description="从这里进入作品，再在书内沉淀世界观、人物、大纲、地图、时间线与章节。"
        actionLabel={isLoading ? "正在同步" : "已接通真实数据"}
        status="implemented"
      />

      {errorMessage ? (
        <div className="rounded-3xl border border-red-400/30 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </section>

      <SectionCard title="作品入口" description="从作品列表进入某本书，再在书内工作区继续写作。">
        <div className="flex flex-wrap gap-3">
          {globalNavItems.filter((item) => item.path !== "/").map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4 text-mist/75 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-white">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{item.label}</span>
                  <span className="mt-1 block text-xs text-mist/60">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-mist/65">正在加载作品列表...</div>
          ) : (
            books.map((item) => {
              const total = bookWorkspaceNavItems.length;
              const readyFlags = [
                item.counts.backstories > 0,
                item.counts.maps > 0,
                item.counts.timeline > 0,
                item.counts.outlines > 0,
                item.counts.characters > 0,
                item.counts.foreshadows > 0,
                item.counts.chapters > 0,
                item.counts.economy > 0
              ];
              const readyCount = readyFlags.filter(Boolean).length;
              const percent = total === 0 ? 0 : Math.round((readyCount / total) * 100);

              return (
                <div key={item.book.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.28em] text-accent/70">继续创作</p>
                      <h3 className="mt-2 truncate text-lg font-medium text-white">{item.book.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-mist/65">{item.book.description || "暂无简介"}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/70">
                      {item.book.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-mist/45">创作进度</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{percent}%</p>
                      <p className="mt-2 text-xs text-mist/60">已填充 {readyCount} / {total} 个模块</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-mist/45">章节</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{item.counts.chapters}</p>
                      <p className="mt-2 text-xs text-mist/60">
                        {item.latestChapter ? `最近：第 ${item.latestChapter.chapterNo} 章` : "还没有章节"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-mist/45">设定底稿</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{item.counts.backstories}</p>
                      <p className="mt-2 text-xs text-mist/60">背景/规则的总条目数</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={getBookWorkspacePath(item.book.id)}
                      className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                    >
                      进入书内工作区
                    </Link>
                    <Link
                      to={`/books/${item.book.id}/chapters${item.latestChapter ? `?chapterId=${item.latestChapter.id}` : ""}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                    >
                      {item.latestChapter ? "继续写作" : "创建第一章"}
                    </Link>
                    <Link
                      to={`/books/${item.book.id}/backstories`}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                    >
                      沉淀设定
                    </Link>
                  </div>
                </div>
              );
            })
          )}
          {!isLoading && books.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
              还没有作品，先去“作品管理”创建一本书。
            </div>
          ) : null}
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
                </div>
                <p className="mt-2 text-sm text-mist/65">{item.description}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
