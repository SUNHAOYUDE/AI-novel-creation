import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bookWorkspaceNavItems, getBookWorkspacePath } from "@/app/routes";
import { getBackstories } from "@/features/backstories/api";
import { getBook } from "@/features/books/api";
import { getEconomyEntries } from "@/features/economy/api";
import { getTimelineEvents } from "@/features/timelines/api";
import { getWorldMaps } from "@/features/world-maps/api";
import type { Book } from "@/shared/types";
import { FeatureStatusBadge } from "@/shared/ui/FeatureStatusBadge";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";

export function BookWorkspaceOverviewPage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const bookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [worldStats, setWorldStats] = useState({
    backstories: 0,
    rules: 0,
    economyEntries: 0,
    maps: 0,
    worldMaps: 0,
    localMaps: 0,
    timelineEvents: 0
  });

  useEffect(() => {
    if (!bookId) {
      setLoading(false);
      return;
    }

    async function loadOverview() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [bookData, backstoryData, mapData, timelineData, economyData] = await Promise.all([
          getBook(bookId),
          getBackstories(bookId),
          getWorldMaps(bookId),
          getTimelineEvents(bookId),
          getEconomyEntries(bookId)
        ]);

        setBook(bookData);
        setWorldStats({
          backstories: backstoryData.length,
          rules: backstoryData.filter((item) => item.kind === "rule").length,
          economyEntries: economyData.length,
          maps: mapData.length,
          worldMaps: mapData.filter((item) => item.mapType === "world").length,
          localMaps: mapData.filter((item) => item.mapType === "local").length,
          timelineEvents: timelineData.length
        });
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载书内总览失败");
      }
      finally {
        setLoading(false);
      }
    }

    void loadOverview();
  }, [bookId]);

  const coreWorldbuildingItems = useMemo(
    () => bookWorkspaceNavItems.filter((item) => ["backstories", "maps", "timeline", "economy"].includes(item.path)),
    []
  );
  const extendedCreationItems = useMemo(
    () => bookWorkspaceNavItems.filter((item) => !["backstories", "maps", "timeline", "economy"].includes(item.path)),
    []
  );
  const statCards = [
    {
      label: "设定条目",
      value: String(worldStats.backstories),
      hint: `其中规则 ${worldStats.rules} 条，可继续喂给大纲和章节`
    },
    {
      label: "经济条目",
      value: String(worldStats.economyEntries),
      hint: "补齐货币、资源与商路，剧情冲突会更有现实牵引力"
    },
    {
      label: "地图图册",
      value: String(worldStats.maps),
      hint: `大地图 ${worldStats.worldMaps} 张，小地图 ${worldStats.localMaps} 张`
    },
    {
      label: "编年节点",
      value: String(worldStats.timelineEvents),
      hint: "建议把重大历史、主线节点与地图事件配套登记"
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="世界设定总览"
        description="把这本书当作一本可持续扩写的设定集来维护：先定世界规则与历史，再铺地图，再串时间线，最后落到大纲、角色与章节。"
        status="implemented"
      />

      <SectionCard title="卷首页" description="先看这本书的世界底稿，再决定下一步要补哪一卷。">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-amber-200/10 bg-[linear-gradient(145deg,rgba(120,53,15,0.18),rgba(15,23,42,0.3))] p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200/60">设定总序</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              {loading ? "正在整理本书设定集..." : `${book?.name ?? "当前作品"}设定卷`}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/75">
              {book?.description || "当前作品已进入书内设定工作区。你可以像维护一本设定书那样，按“背景与规则 -> 地图图册 -> 编年时间线 -> 大纲角色章节”的顺序持续沉淀内容。"}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {statCards.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-mist/45">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{loading ? "--" : item.value}</p>
                  <p className="mt-2 text-sm text-mist/60">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-accent/70">建议流程</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-mist/75">
                1. 先用 AI 生成背景故事、世界规则、势力与隐藏真相。
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-mist/75">
                2. 再建立大地图、区域图、小地图，并把关键事件钉到地图上。
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-mist/75">
                3. 再补货币、资源、贸易与财政机制，明确这本书的利益流向。
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-mist/75">
                4. 最后把历史与主线节点串成时间线，形成真正可追溯的编年史。
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="世界设定目录" description="这几卷是当前书内世界观工作区的核心入口。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {coreWorldbuildingItems.map((item) => {
            const Icon = item.icon;
            const targetPath = bookId ? getBookWorkspacePath(bookId, item.path) : "#";

            return (
              <Link
                key={item.path}
                to={targetPath}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-accent/30 hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
                  <Icon size={18} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-medium text-white">{item.label}</h3>
                  <FeatureStatusBadge status={item.status} compact />
                </div>
                <p className="mt-2 text-sm text-mist/65">{item.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.28em] text-mist/40">
                  {item.path === "backstories"
                    ? "第一卷 / 世界底稿"
                    : item.path === "maps"
                      ? "第二卷 / 空间图册"
                      : item.path === "economy"
                        ? "第三卷 / 利益结构"
                        : "第四卷 / 编年史"}
                </p>
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="后续创作模块" description="世界设定稳定后，可以继续进入这些模块推进正文创作。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {extendedCreationItems.map((item) => {
            const Icon = item.icon;
            const targetPath = bookId ? getBookWorkspacePath(bookId, item.path) : "#";

            return (
              <Link
                key={item.path}
                to={targetPath}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-accent/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                    <Icon size={18} />
                  </div>
                  <FeatureStatusBadge status={item.status} compact />
                </div>
                <h3 className="mt-4 text-base font-medium text-white">{item.label}</h3>
                <p className="mt-2 text-sm text-mist/65">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
