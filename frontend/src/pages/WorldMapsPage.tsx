import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBooks } from "@/features/books/api";
import { createWorldMap, deleteWorldMap, getWorldMaps, updateWorldMap } from "@/features/world-maps/api";
import type { Book, MapMarker, WorldMap, WorldMapPayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";

const mapTypeLabelMap: Record<WorldMap["mapType"], string> = {
  world: "大地图",
  region: "区域图",
  local: "小地图"
};

function createMarker(): MapMarker {
  return {
    id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    markerType: "event",
    x: 50,
    y: 50,
    timeLabel: "",
    description: ""
  };
}

const defaultState: WorldMapPayload = {
  bookId: 0,
  parentId: null,
  title: "",
  mapType: "world",
  description: "",
  width: 1000,
  height: 700,
  sortOrder: 1,
  markers: [createMarker()]
};

export function WorldMapsPage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [maps, setMaps] = useState<WorldMap[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [editingMap, setEditingMap] = useState<WorldMap | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingMaps, setLoadingMaps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const initialState = useMemo<WorldMapPayload>(() => ({
    ...defaultState,
    bookId: lockedBookId ?? books[0]?.id ?? 0
  }), [books, lockedBookId]);
  const [formState, setFormState] = useState<WorldMapPayload>(initialState);

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
      setMaps([]);
      return;
    }

    async function loadMaps() {
      setLoadingMaps(true);
      setErrorMessage("");

      try {
        const data = await getWorldMaps(selectedBookId);
        setMaps(data);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载地图失败");
      }
      finally {
        setLoadingMaps(false);
      }
    }

    void loadMaps();
  }, [selectedBookId]);

  useEffect(() => {
    if (!editingMap) {
      setFormState(initialState);
      setActiveMarkerId(initialState.markers[0]?.id ?? null);
      return;
    }

    setFormState({
      bookId: editingMap.bookId,
      parentId: editingMap.parentId,
      title: editingMap.title,
      mapType: editingMap.mapType,
      description: editingMap.description,
      width: editingMap.width,
      height: editingMap.height,
      sortOrder: editingMap.sortOrder,
      markers: editingMap.markers.length > 0 ? editingMap.markers : [createMarker()]
    });
    setActiveMarkerId(editingMap.markers[0]?.id ?? null);
  }, [editingMap, initialState]);

  function updateField<Key extends keyof WorldMapPayload>(key: Key, value: WorldMapPayload[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateMarker(markerId: string, patch: Partial<MapMarker>) {
    setFormState((current) => ({
      ...current,
      markers: current.markers.map((marker) => (
        marker.id === markerId ? { ...marker, ...patch } : marker
      ))
    }));
  }

  function addMarker() {
    const marker = createMarker();
    setFormState((current) => ({
      ...current,
      markers: [...current.markers, marker]
    }));
    setActiveMarkerId(marker.id);
  }

  function removeMarker(markerId: string) {
    setFormState((current) => {
      const nextMarkers = current.markers.filter((marker) => marker.id !== markerId);
      return {
        ...current,
        markers: nextMarkers.length > 0 ? nextMarkers : [createMarker()]
      };
    });
    setActiveMarkerId(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingMap) {
        const updated = await updateWorldMap(editingMap.id, formState);
        setMaps((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingMap(updated);
      }
      else {
        const created = await createWorldMap(formState);
        setMaps((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
        setEditingMap(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存地图失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setErrorMessage("");

    try {
      await deleteWorldMap(id);
      setMaps((current) => current.filter((item) => item.id !== id));

      if (editingMap?.id === id) {
        setEditingMap(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除地图失败");
    }
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!activeMarkerId) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    updateMarker(activeMarkerId, {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2))
    });
  }

  const availableParentMaps = useMemo(() => maps.filter((item) => item.id !== editingMap?.id), [editingMap?.id, maps]);
  const summaryText = useMemo(() => {
    if (loadingBooks) {
      return "正在加载当前作品的地图册...";
    }

    const worldCount = maps.filter((item) => item.mapType === "world").length;
    const localCount = maps.filter((item) => item.mapType === "local").length;
    return `当前作品已有 ${maps.length} 张地图，其中大地图 ${worldCount} 张，小地图 ${localCount} 张。`;
  }, [loadingBooks, maps]);
  const groupedMaps = useMemo(
    () => (["world", "region", "local"] as WorldMap["mapType"][])
      .map((mapType) => ({
        mapType,
        items: maps.filter((item) => item.mapType === mapType)
      }))
      .filter((group) => group.items.length > 0),
    [maps]
  );
  const activeMarker = useMemo(
    () => formState.markers.find((marker) => marker.id === activeMarkerId) ?? null,
    [activeMarkerId, formState.markers]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="地图系统"
        description="管理大地图、小地图和事件标记。点击右侧画布可直接给当前事件点定位，适合搭建像书一样的世界空间感。"
        status="implemented"
      />

      <SectionCard title="图册摘要" description="先搭世界总图，再拆区域图与小地图，最后把事件钉到地理空间里。">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <div className="rounded-[2rem] border border-amber-200/10 bg-[linear-gradient(145deg,rgba(120,53,15,0.18),rgba(15,23,42,0.3))] p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200/60">图册摘要</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">这本书的空间图谱</h2>
            <p className="mt-4 text-sm leading-7 text-mist/75">{summaryText}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-mist/45">大地图 / 区域图 / 小地图</p>
            <p className="mt-3 text-3xl font-semibold text-white">{maps.length}</p>
            <p className="mt-2 text-sm text-mist/60">建议至少保留 1 张总图，再向下拆局部战场、主城和关键场景。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-mist/45">事件锚点</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {maps.reduce((total, item) => total + item.markers.length, 0)}
            </p>
            <p className="mt-2 text-sm text-mist/60">把关键事件、地点和历史节点标进地图，后面时间线会更容易串起来。</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="地图册" description={summaryText}>
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
                  setEditingMap(null);
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

          {loadingMaps ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载地图册...</div>
          ) : (
            <div className="space-y-4">
              {groupedMaps.map((group, groupIndex) => (
                <section key={group.mapType} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-accent/70">Atlas {groupIndex + 1}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{mapTypeLabelMap[group.mapType]}</h3>
                      <p className="mt-2 text-sm text-mist/65">
                        {group.mapType === "world"
                          ? "用于承载国家、洲域、主航线与大范围势力版图。"
                          : group.mapType === "region"
                            ? "用于拆解某个州郡、城区、战区或宗门势力范围。"
                            : "用于表现主城、遗迹、战场、宅院等高细节场景。"}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/65">
                      共 {group.items.length} 张
                    </span>
                  </div>

                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <article
                        key={item.id}
                        className={[
                          "rounded-[1.75rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 transition",
                          editingMap?.id === item.id ? "border-accent/40" : "border-white/10"
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-medium text-white">{item.title}</h4>
                              <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                                {mapTypeLabelMap[item.mapType]}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-mist/65">{item.description || "暂无地图说明"}</p>
                            <p className="mt-3 text-xs text-mist/45">
                              上级地图：{item.parentTitle || "无"} | 事件点：{item.markers.length}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingMap(item)}
                            className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                          >
                            编辑地图
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

              {!loadingMaps && maps.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                  当前作品还没有地图，先创建一张大地图或小地图。
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard title="地图画布" description="先选中某个事件点，再点击下方画布，即可把事件锚定到地图上。">
            <div className="space-y-4">
              <div
                role="presentation"
                onClick={handleCanvasClick}
                className="relative min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(7,12,24,0.96))] p-6"
              >
                <div className="absolute inset-x-6 top-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-mist/75">
                  {editingMap
                    ? `${formState.title || "未命名地图"} | ${mapTypeLabelMap[formState.mapType]} | 点击画布可调整当前事件点位置`
                    : "当前为新建地图模式 | 先填写右侧表单，或在左侧点“编辑地图”载入已有图册"}
                </div>

                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:56px_56px]" />

                {formState.markers.map((marker) => (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveMarkerId(marker.id);
                    }}
                    className={[
                      "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs transition",
                      activeMarkerId === marker.id
                        ? "border-amber-300/60 bg-amber-400/20 text-amber-100"
                        : "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                    ].join(" ")}
                    style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  >
                    {marker.title || "事件点"}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-mist/45">当前地图</p>
                  <p className="mt-3 text-lg font-medium text-white">{editingMap ? formState.title || "未命名地图" : "新建地图草稿"}</p>
                  <p className="mt-2 text-sm text-mist/60">{editingMap ? mapTypeLabelMap[formState.mapType] : "未载入已有地图时，右侧用于创建新地图"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-mist/45">当前选中锚点</p>
                  <p className="mt-3 text-lg font-medium text-white">{activeMarker?.title || "未选择"}</p>
                  <p className="mt-2 text-sm text-mist/60">
                    {activeMarker ? `${activeMarker.x}% / ${activeMarker.y}%` : "点击某个事件点后可拖动到画布位置"}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-mist/45">事件说明</p>
                  <p className="mt-3 text-sm leading-6 text-mist/60">
                    {activeMarker?.description || "当前没有事件说明，可以在下方编辑区补充剧情意义、地理作用和时间标记。"}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="地图编辑区" description="建议先建一张大地图，再补充小地图和事件点，形成立体世界空间。">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-mist/70">
                  地图标题
                  <input
                    value={formState.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                    placeholder="例如：九州总图 / 皇城区域图 / 黑潮港小地图"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm text-mist/70">
                  地图类型
                  <select
                    value={formState.mapType}
                    onChange={(event) => updateField("mapType", event.target.value as WorldMapPayload["mapType"])}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  >
                    <option value="world">大地图</option>
                    <option value="region">区域图</option>
                    <option value="local">小地图</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-mist/70">
                  上级地图
                  <select
                    value={formState.parentId ?? ""}
                    onChange={(event) => updateField("parentId", event.target.value ? Number(event.target.value) : null)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  >
                    <option value="">无</option>
                    {availableParentMaps.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-mist/70">
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
                地图说明
                <textarea
                  value={formState.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="写这张地图覆盖的地区、势力边界、关键地标或叙事作用。"
                />
              </label>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-white">主要事件点</p>
                  <button
                    type="button"
                    onClick={addMarker}
                    className="rounded-2xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent transition hover:bg-accent/20"
                  >
                    新增事件点
                  </button>
                </div>

                <div className="space-y-4">
                  {formState.markers.map((marker, index) => (
                    <div
                      key={marker.id}
                      className={[
                        "rounded-2xl border p-4 transition",
                        activeMarkerId === marker.id ? "border-accent/40 bg-accent/5" : "border-white/10 bg-white/[0.02]"
                      ].join(" ")}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveMarkerId(marker.id)}
                          className="text-left text-sm font-medium text-white"
                        >
                          事件点 {index + 1}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMarker(marker.id)}
                          className="text-xs text-mist/60 transition hover:text-red-200"
                        >
                          删除
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={marker.title}
                          onChange={(event) => updateMarker(marker.id, { title: event.target.value })}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
                          placeholder="事件或地点标题"
                        />
                        <select
                          value={marker.markerType}
                          onChange={(event) => updateMarker(marker.id, { markerType: event.target.value as MapMarker["markerType"] })}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
                        >
                          <option value="event">主要事件</option>
                          <option value="place">重要地点</option>
                        </select>
                        <input
                          value={marker.timeLabel}
                          onChange={(event) => updateMarker(marker.id, { timeLabel: event.target.value })}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
                          placeholder="时间标记，例如：帝历 312 年"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={marker.x}
                            onChange={(event) => updateMarker(marker.id, { x: Number(event.target.value) })}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
                            placeholder="X"
                          />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={marker.y}
                            onChange={(event) => updateMarker(marker.id, { y: Number(event.target.value) })}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
                            placeholder="Y"
                          />
                        </div>
                      </div>

                      <textarea
                        value={marker.description}
                        onChange={(event) => updateMarker(marker.id, { description: event.target.value })}
                        className="mt-3 min-h-[100px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
                        placeholder="记录这个事件点的具体作用、地理意义或剧情价值。"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || (!lockedBookId && books.length === 0)}
                  className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "保存中..." : editingMap ? "保存地图" : "创建地图"}
                </button>
                {editingMap ? (
                  <button
                    type="button"
                    onClick={() => setEditingMap(null)}
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
    </div>
  );
}
