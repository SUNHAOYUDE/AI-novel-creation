import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuditLogs } from "@/features/audit-logs/api";
import { getBooks } from "@/features/books/api";
import { createEconomyEntry, deleteEconomyEntry, getEconomyEntries, updateEconomyEntry } from "@/features/economy/api";
import type { AuditLog, Book, EconomyCategory, EconomyEntry, EconomyEntryPayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";

const economyCategoryLabelMap: Record<EconomyCategory, string> = {
  currency: "货币体系",
  resource: "资源体系",
  industry: "产业结构",
  trade: "贸易网络",
  finance: "财政制度"
};

const economyCategoryDescriptionMap: Record<EconomyCategory, string> = {
  currency: "定义通用货币、等价物、兑换规则和财富衡量方式。",
  resource: "定义重要资源、稀缺品、战略物资和垄断来源。",
  industry: "定义主要产业、生产链、地区分工和经济命脉。",
  trade: "定义贸易路线、商路节点、边境流通和黑市体系。",
  finance: "定义税制、财政来源、补给机制和经济危机触发点。"
};

const defaultState: EconomyEntryPayload = {
  bookId: 0,
  category: "currency",
  title: "",
  region: "",
  circulation: "",
  coreValue: "",
  description: "",
  risk: "",
  sortOrder: 1
};

export function EconomyPage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [entries, setEntries] = useState<EconomyEntry[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [editingEntry, setEditingEntry] = useState<EconomyEntry | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const initialState = useMemo<EconomyEntryPayload>(() => ({
    ...defaultState,
    bookId: lockedBookId ?? books[0]?.id ?? 0
  }), [books, lockedBookId]);
  const [formState, setFormState] = useState<EconomyEntryPayload>(initialState);

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
      setEntries([]);
      return;
    }

    async function loadEntries() {
      setLoadingEntries(true);
      setErrorMessage("");

      try {
        const data = await getEconomyEntries(selectedBookId);
        setEntries(data);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载经济系统失败");
      }
      finally {
        setLoadingEntries(false);
      }
    }

    void loadEntries();
  }, [selectedBookId]);

  useEffect(() => {
    if (!editingEntry) {
      setFormState(initialState);
      return;
    }

    setFormState({
      bookId: editingEntry.bookId,
      category: editingEntry.category,
      title: editingEntry.title,
      region: editingEntry.region,
      circulation: editingEntry.circulation,
      coreValue: editingEntry.coreValue,
      description: editingEntry.description,
      risk: editingEntry.risk,
      sortOrder: editingEntry.sortOrder
    });
  }, [editingEntry, initialState]);

  function updateField<Key extends keyof EconomyEntryPayload>(key: Key, value: EconomyEntryPayload[Key]) {
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
      if (editingEntry) {
        const updated = await updateEconomyEntry(editingEntry.id, formState);
        setEntries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingEntry(updated);
      }
      else {
        const created = await createEconomyEntry(formState);
        setEntries((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
        setEditingEntry(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存经济条目失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setErrorMessage("");

    try {
      await deleteEconomyEntry(id);
      setEntries((current) => current.filter((item) => item.id !== id));

      if (editingEntry?.id === id) {
        setEditingEntry(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除经济条目失败");
    }
  }

  const groupedEntries = useMemo(
    () => (["currency", "resource", "industry", "trade", "finance"] as EconomyCategory[])
      .map((category) => ({
        category,
        items: entries.filter((item) => item.category === category)
      }))
      .filter((group) => group.items.length > 0),
    [entries]
  );
  const summaryText = useMemo(() => {
    if (loadingBooks) {
      return "正在装载当前作品的经济设定...";
    }

    const tradeCount = entries.filter((item) => item.category === "trade").length;
    const resourceCount = entries.filter((item) => item.category === "resource").length;
    return `当前作品已有 ${entries.length} 条经济设定，其中贸易网络 ${tradeCount} 条、资源体系 ${resourceCount} 条。`;
  }, [entries, loadingBooks]);

  useEffect(() => {
    if (!showAudit || !selectedBookId) {
      return;
    }

    async function loadAudit() {
      setLoadingAudit(true);

      try {
        const data = await getAuditLogs({ bookId: selectedBookId, entityType: "economy-entry", limit: 50 });
        setAuditLogs(data);
      }
      catch (error) {
        setAuditLogs([]);
        setErrorMessage(error instanceof Error ? error.message : "加载审计日志失败");
      }
      finally {
        setLoadingAudit(false);
      }
    }

    void loadAudit();
  }, [selectedBookId, showAudit]);

  function downloadText(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    if (!selectedBookId) {
      return;
    }

    downloadText(`book-${selectedBookId}-economy.json`, JSON.stringify(entries, null, 2), "application/json;charset=utf-8");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="经济系统"
        description="围绕当前作品维护货币、资源、产业、贸易与财政规则，让世界观不仅能讲故事，也能讲清楚利益如何流动。"
        status="implemented"
      />

      <SectionCard title="经济卷摘要" description="把财富如何产生、如何流通、为何失衡写清楚，世界才会更真实。">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <div className="rounded-[2rem] border border-amber-200/10 bg-[linear-gradient(145deg,rgba(120,53,15,0.18),rgba(15,23,42,0.3))] p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200/60">经济摘要</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">这本书的利益流动图</h2>
            <p className="mt-4 text-sm leading-7 text-mist/75">{summaryText}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-mist/45">经济条目</p>
            <p className="mt-3 text-3xl font-semibold text-white">{entries.length}</p>
            <p className="mt-2 text-sm text-mist/60">建议至少先补齐货币、资源和贸易三类，主线冲突会更有现实牵引力。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-mist/45">失衡点</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {entries.filter((item) => item.risk.trim().length > 0).length}
            </p>
            <p className="mt-2 text-sm text-mist/60">写清楚稀缺、垄断、税负和走私，剧情中的冲突来源会更自然。</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <SectionCard title="经济设定目录" description={summaryText}>
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
                  setEditingEntry(null);
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

          {loadingEntries ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载经济设定...</div>
          ) : (
            <div className="space-y-4">
              {groupedEntries.map((group, groupIndex) => (
                <section key={group.category} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-accent/70">卷 {groupIndex + 1}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{economyCategoryLabelMap[group.category]}</h3>
                      <p className="mt-2 text-sm text-mist/65">{economyCategoryDescriptionMap[group.category]}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/65">
                      共 {group.items.length} 条
                    </span>
                  </div>

                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs uppercase tracking-[0.28em] text-accent/70">条目 {item.sortOrder}</p>
                              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200">
                                {economyCategoryLabelMap[item.category]}
                              </span>
                              {item.region ? (
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-mist/65">
                                  {item.region}
                                </span>
                              ) : null}
                            </div>
                            <h4 className="mt-3 text-lg font-medium text-white">{item.title}</h4>
                            <p className="mt-3 text-sm leading-7 text-mist/65 whitespace-pre-wrap">{item.description || "暂无经济设定说明"}</p>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase tracking-[0.26em] text-mist/45">核心价值物</p>
                                <p className="mt-2 text-sm text-white">{item.coreValue || "未设置"}</p>
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase tracking-[0.26em] text-mist/45">流通机制</p>
                                <p className="mt-2 text-sm text-white">{item.circulation || "未设置"}</p>
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase tracking-[0.26em] text-mist/45">风险点</p>
                                <p className="mt-2 text-sm text-white">{item.risk || "未设置"}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingEntry(item)}
                            className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                          >
                            编辑条目
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

              {!loadingEntries && entries.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                  当前作品还没有经济设定，先补一条货币体系、资源来源或贸易网络。
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard title="经济分类索引" description="你可以把经济系统当成世界观的利益层，用来解释角色为什么争、国家为什么打、商路为什么断。">
            <div className="grid gap-3 md:grid-cols-2">
              {(["currency", "resource", "industry", "trade", "finance"] as EconomyCategory[]).map((category) => (
                <div key={category} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{economyCategoryLabelMap[category]}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-mist/70">
                      {entries.filter((item) => item.category === category).length} 条
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-mist/65">{economyCategoryDescriptionMap[category]}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="导出与审计" description="导出经济设定到本地，并查看最近的编辑记录。">
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={exportJson}
                  disabled={!selectedBookId}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  导出 JSON
                </button>
                <button
                  type="button"
                  onClick={() => setShowAudit((current) => !current)}
                  disabled={!selectedBookId}
                  className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showAudit ? "收起审计" : "查看审计"}
                </button>
              </div>

              {showAudit ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-white">最近 50 条审计记录</p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedBookId) {
                          return;
                        }
                        setLoadingAudit(true);
                        try {
                          const data = await getAuditLogs({ bookId: selectedBookId, entityType: "economy-entry", limit: 50 });
                          setAuditLogs(data);
                        }
                        catch (error) {
                          setAuditLogs([]);
                          setErrorMessage(error instanceof Error ? error.message : "加载审计日志失败");
                        }
                        finally {
                          setLoadingAudit(false);
                        }
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-mist/80 transition hover:bg-white/[0.08]"
                    >
                      刷新
                    </button>
                  </div>

                  {loadingAudit ? (
                    <div className="text-sm text-mist/65">正在加载审计记录...</div>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-white">{log.summary}</p>
                            <p className="text-xs text-mist/50">{new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                          <p className="mt-2 text-xs text-mist/60">{log.action}</p>
                        </div>
                      ))}

                      {auditLogs.length === 0 ? (
                        <div className="text-sm text-mist/65">暂无审计记录（需要后端重启后生效）。</div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="经济设定编辑区" description="建议先定义货币与资源，再补产业链、商路和财政制度，这样世界观会更稳定。">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-mist/70">
                  条目标题
                  <input
                    value={formState.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                    placeholder="例如：银砂币体系 / 北境盐铁垄断 / 黑潮海贸航线"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm text-mist/70">
                  经济分类
                  <select
                    value={formState.category}
                    onChange={(event) => updateField("category", event.target.value as EconomyCategory)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  >
                    <option value="currency">货币体系</option>
                    <option value="resource">资源体系</option>
                    <option value="industry">产业结构</option>
                    <option value="trade">贸易网络</option>
                    <option value="finance">财政制度</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-mist/70">
                  主要地区
                  <input
                    value={formState.region}
                    onChange={(event) => updateField("region", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                    placeholder="例如：帝都 / 北境 / 海贸诸港"
                  />
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

                <label className="grid gap-2 text-sm text-mist/70">
                  核心价值物
                  <input
                    value={formState.coreValue}
                    onChange={(event) => updateField("coreValue", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                    placeholder="例如：银砂、灵石、盐铁、粮票"
                  />
                </label>

                <label className="grid gap-2 text-sm text-mist/70">
                  流通机制
                  <input
                    value={formState.circulation}
                    onChange={(event) => updateField("circulation", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                    placeholder="例如：官铸流通 / 商队兑换 / 黑市转运"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-mist/70">
                经济设定说明
                <textarea
                  value={formState.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className="min-h-[180px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="写清楚这个经济机制如何运作、谁从中获利、会影响哪些势力或剧情。"
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                风险与冲突点
                <textarea
                  value={formState.risk}
                  onChange={(event) => updateField("risk", event.target.value)}
                  className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：资源枯竭、税负过重、商路封锁、地方垄断、假币泛滥。"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || (!lockedBookId && books.length === 0)}
                  className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "保存中..." : editingEntry ? "保存条目" : "创建条目"}
                </button>
                {editingEntry ? (
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
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
