import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBooks } from "@/features/books/api";
import { getTimelineEvents, createTimelineEvent, updateTimelineEvent, deleteTimelineEvent } from "@/features/timelines/api";
import { getWorldMaps } from "@/features/world-maps/api";
import type { Book, TimelineEvent, TimelineEventPayload, WorldMap } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";

const defaultState: TimelineEventPayload = {
  bookId: 0,
  relatedMapId: null,
  era: "",
  timeLabel: "",
  title: "",
  description: "",
  sortOrder: 1
};

export function TimelinePage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [worldMaps, setWorldMaps] = useState<WorldMap[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const initialState = useMemo<TimelineEventPayload>(() => ({
    ...defaultState,
    bookId: lockedBookId ?? books[0]?.id ?? 0
  }), [books, lockedBookId]);
  const [formState, setFormState] = useState<TimelineEventPayload>(initialState);

  useEffect(() => {
    async function bootstrap() {
      setLoadingBooks(true);
      setErrorMessage("");

      try {
        const data = await getBooks();
        const bookId = lockedBookId ?? data[0]?.id ?? null;
        setBooks(data);
        setSelectedBookId(bookId);
        setFormState((current) => ({
          ...current,
          bookId: bookId ?? 0
        }));
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载作品失败");
      }
      finally {
        setLoadingBooks(false);
      }
    }

    void bootstrap();
  }, [lockedBookId]);

  useEffect(() => {
    if (!selectedBookId) {
      setEvents([]);
      setWorldMaps([]);
      return;
    }

    async function loadData() {
      setLoadingEvents(true);
      setErrorMessage("");

      try {
        const [eventData, mapData] = await Promise.all([
          getTimelineEvents(selectedBookId),
          getWorldMaps(selectedBookId)
        ]);
        setEvents(eventData);
        setWorldMaps(mapData);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载时间线失败");
      }
      finally {
        setLoadingEvents(false);
      }
    }

    void loadData();
  }, [selectedBookId]);

  useEffect(() => {
    if (!editingEvent) {
      setFormState(initialState);
      return;
    }

    setFormState({
      bookId: editingEvent.bookId,
      relatedMapId: editingEvent.relatedMapId,
      era: editingEvent.era,
      timeLabel: editingEvent.timeLabel,
      title: editingEvent.title,
      description: editingEvent.description,
      sortOrder: editingEvent.sortOrder
    });
  }, [editingEvent, initialState]);

  function updateField<Key extends keyof TimelineEventPayload>(key: Key, value: TimelineEventPayload[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingEvent) {
        const updated = await updateTimelineEvent(editingEvent.id, formState);
        setEvents((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingEvent(updated);
      }
      else {
        const created = await createTimelineEvent(formState);
        setEvents((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
        setEditingEvent(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存时间线失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setErrorMessage("");

    try {
      await deleteTimelineEvent(id);
      setEvents((current) => current.filter((item) => item.id !== id));

      if (editingEvent?.id === id) {
        setEditingEvent(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除时间线事件失败");
    }
  }

  const summaryText = useMemo(() => {
    if (loadingBooks) {
      return "正在装载这本书的编年史...";
    }

    return `当前作品已有 ${events.length} 个时间节点，可与地图和背景设定联动。`;
  }, [events.length, loadingBooks]);
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();

    for (const item of events) {
      const key = item.era.trim() || "未分卷时代";
      const current = groups.get(key) ?? [];
      current.push(item);
      groups.set(key, current);
    }

    return Array.from(groups.entries()).map(([era, items]) => ({
      era,
      items: items.sort((left, right) => left.sortOrder - right.sortOrder)
    }));
  }, [events]);
  const mappedEventCount = useMemo(
    () => events.filter((item) => item.relatedMapId !== null).length,
    [events]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="时间线"
        description="像书一样整理这本作品的编年史，把重大历史、关键事件和地图位置串成一条可读的时间轴。"
        status="implemented"
      />

      <SectionCard title="编年史摘要" description="时间线不是简单记事，而是把规则、地图和主线冲突串成一条可查的叙事脉络。">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <div className="rounded-[2rem] border border-amber-200/10 bg-[linear-gradient(145deg,rgba(120,53,15,0.18),rgba(15,23,42,0.3))] p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200/60">编年摘要</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">这本书的时间卷轴</h2>
            <p className="mt-4 text-sm leading-7 text-mist/75">{summaryText}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-mist/45">时代分卷</p>
            <p className="mt-3 text-3xl font-semibold text-white">{groupedEvents.length}</p>
            <p className="mt-2 text-sm text-mist/60">按时代、卷别或历史阶段分组后，查阅和补设定会更清晰。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-mist/45">已关联地图</p>
            <p className="mt-3 text-3xl font-semibold text-white">{mappedEventCount}</p>
            <p className="mt-2 text-sm text-mist/60">尽量让重大历史与关键剧情都能落到地图位置，后续排查逻辑会更稳。</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <SectionCard title="编年目录" description={summaryText}>
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {!lockedBookId ? (
            <label className="mb-4 grid gap-2 text-sm text-mist/70">
              当前查看作品
              <select
                value={selectedBookId ?? ""}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setSelectedBookId(Number.isNaN(value) ? null : value);
                  setEditingEvent(null);
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                disabled={books.length === 0}
              >
                {books.length === 0 ? <option value="">暂无作品</option> : null}
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {loadingEvents ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载时间线...</div>
          ) : (
            <div className="space-y-5">
              {groupedEvents.map((group, groupIndex) => (
                <section key={group.era} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-accent/70">Volume {groupIndex + 1}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{group.era}</h3>
                      <p className="mt-2 text-sm text-mist/65">把同一时代或同一卷的事件整理在一起，阅读感会更像一本真正的编年史。</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/65">
                      共 {group.items.length} 节点
                    </span>
                  </div>

                  <div className="space-y-5">
                    {group.items.map((item) => (
                      <article key={item.id} className="relative rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 pl-8">
                        <div className="absolute left-4 top-5 h-[calc(100%-2.5rem)] w-px bg-gradient-to-b from-accent/80 via-accent/30 to-transparent" />
                        <div className="absolute left-[11px] top-5 h-3 w-3 rounded-full border border-accent/50 bg-accent/80" />

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200">
                                {item.era || "主线时代"}
                              </span>
                              <span className="text-xs uppercase tracking-[0.28em] text-accent/70">{item.timeLabel}</span>
                            </div>
                            <h4 className="mt-3 text-base font-medium text-white">{item.title}</h4>
                            <p className="mt-3 text-sm leading-7 text-mist/65 whitespace-pre-wrap">{item.description || "暂无事件说明"}</p>
                            <p className="mt-3 text-xs text-mist/45">
                              关联地图：{item.relatedMapTitle || "未关联"} | 编号：{item.sortOrder}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingEvent(item)}
                            className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                          >
                            编辑事件
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                          >
                            删除
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}

              {!loadingEvents && events.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                  当前作品还没有时间线，先补一条重大历史或剧情节点。
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>

        <SectionCard title="时间线编辑台" description="建议把历史事件、时代分段、剧情转折和地图位置一起登记，形成真正可查的编年史。">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-mist/70">
                所属时代
                <input
                  value={formState.era}
                  onChange={(event) => updateField("era", event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：旧王朝末年 / 帝历初年 / 主线第一卷"
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                时间标记
                <input
                  value={formState.timeLabel}
                  onChange={(event) => updateField("timeLabel", event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：帝历 312 年 / 第三章之前 / 冬季远征夜"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                事件标题
                <input
                  value={formState.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：黑潮港失火 / 宗门禁令颁布"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                关联地图
                <select
                  value={formState.relatedMapId ?? ""}
                  onChange={(event) => updateField("relatedMapId", event.target.value ? Number(event.target.value) : null)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                >
                  <option value="">不关联</option>
                  {worldMaps.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-mist/70 md:col-span-2">
                排序
                <input
                  type="number"
                  min={1}
                  value={formState.sortOrder}
                  onChange={(event) => updateField("sortOrder", Number(event.target.value))}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-mist/70">
              事件内容
              <textarea
                value={formState.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                placeholder="写明这个时间点发生了什么、改变了什么、会影响哪些角色或地域。"
              />
            </label>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/70">
              当前地图资产：{worldMaps.length} 张。建议把时间线节点和地图事件点配套录入，后面做剧情一致性检查会更稳。
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting || (!lockedBookId && books.length === 0)}
                className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "保存中..." : editingEvent ? "保存事件" : "创建事件"}
              </button>

              {editingEvent ? (
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                >
                  取消编辑
                </button>
              ) : null}
            </div>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
