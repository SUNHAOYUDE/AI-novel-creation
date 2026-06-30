import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuditLogs } from "@/features/audit-logs/api";
import { BackstoryForm } from "@/features/backstories/BackstoryForm";
import { createBackstory, deleteBackstory, generateBackstories, getBackstories, updateBackstory } from "@/features/backstories/api";
import { getBooks } from "@/features/books/api";
import type { AuditLog, Backstory, BackstoryPayload, Book, GenerateBackstoryPayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";

const defaultGenerateState: GenerateBackstoryPayload = {
  bookId: 0,
  prompt: "",
  focus: "优先补齐时代背景、底层规则、势力格局、重大历史与隐藏秘密",
  count: 4
};

const backstoryKindLabelMap: Record<Backstory["kind"], string> = {
  history: "背景故事",
  rule: "世界规则",
  culture: "文化设定",
  faction: "势力结构",
  secret: "隐藏真相"
};

const backstoryKindDescriptionMap: Record<Backstory["kind"], string> = {
  history: "记录时代背景、历史断层、战争和王朝更替。",
  rule: "定义力量体系、禁忌法则、社会秩序和不可违背的底层机制。",
  culture: "补充礼制、风俗、信仰、职业和地域文化差异。",
  faction: "整理宗门、王朝、组织、阵营和势力关系。",
  secret: "沉淀隐藏线索、被掩盖的真相和后续反转空间。"
};

const promptTemplates = [
  {
    label: "玄幻宗门",
    prompt: "生成一个带宗门体系、禁忌法则、古代王朝断层和海上贸易版图的玄幻世界，要求存在能影响主角命运的隐藏规则。",
    focus: "优先补齐修炼规则、宗门秩序、古代历史与势力版图"
  },
  {
    label: "悬疑都市",
    prompt: "生成一个现代都市悬疑世界，要求有表世界与里世界的双层规则、案件背后的历史旧案，以及核心组织的运行逻辑。",
    focus: "强调世界规则、历史旧案、组织秘密与社会运行机制"
  },
  {
    label: "末世废土",
    prompt: "生成一个末世废土世界，要求包含资源分配规则、聚居地秩序、旧文明遗迹和决定主线冲突的关键禁令。",
    focus: "强调生存规则、聚居地关系、遗迹历史与禁令体系"
  }
];

export function BackstoriesPage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [backstories, setBackstories] = useState<Backstory[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [editingBackstory, setEditingBackstory] = useState<Backstory | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingBackstories, setLoadingBackstories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collapsedKinds, setCollapsedKinds] = useState<Set<Backstory["kind"]>>(() => new Set());
  const [collapsedSeedBookId, setCollapsedSeedBookId] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generateState, setGenerateState] = useState<GenerateBackstoryPayload>({
    ...defaultGenerateState,
    bookId: lockedBookId ?? 0
  });

  useEffect(() => {
    async function bootstrap() {
      setLoadingBooks(true);
      setErrorMessage("");

      try {
        const data = await getBooks();
        setBooks(data);
        const bookId = lockedBookId ?? data[0]?.id ?? null;
        setSelectedBookId(bookId);
        setGenerateState((current) => ({
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
      setBackstories([]);
      return;
    }

    async function loadBackstories() {
      setLoadingBackstories(true);
      setErrorMessage("");

      try {
        const data = await getBackstories(selectedBookId);
        setBackstories(data);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载背景故事失败");
      }
      finally {
        setLoadingBackstories(false);
      }
    }

    void loadBackstories();
  }, [selectedBookId]);

  useEffect(() => {
    if (!selectedBookId) {
      return;
    }

    setGenerateState((current) => ({
      ...current,
      bookId: selectedBookId
    }));
  }, [selectedBookId]);

  useEffect(() => {
    if (!selectedBookId || loadingBackstories) {
      return;
    }

    if (collapsedSeedBookId === selectedBookId) {
      return;
    }

    setCollapsedSeedBookId(selectedBookId);
    setCollapsedKinds(new Set(
      (["history", "rule", "culture", "faction", "secret"] as Backstory["kind"][])
        .filter((kind) => backstories.filter((item) => item.kind === kind).length >= 6)
    ));
  }, [backstories, collapsedSeedBookId, loadingBackstories, selectedBookId]);

  useEffect(() => {
    if (!showAudit || !selectedBookId) {
      return;
    }

    async function loadAudit() {
      setLoadingAudit(true);

      try {
        const data = await getAuditLogs({ bookId: selectedBookId, entityType: "backstory", limit: 50 });
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

  function toggleKind(kind: Backstory["kind"]) {
    setCollapsedKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) {
        next.delete(kind);
      }
      else {
        next.add(kind);
      }
      return next;
    });
  }

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

    downloadText(`book-${selectedBookId}-backstories.json`, JSON.stringify(backstories, null, 2), "application/json;charset=utf-8");
  }

  function exportMarkdown() {
    if (!selectedBookId) {
      return;
    }

    const sections = (["history", "rule", "culture", "faction", "secret"] as Backstory["kind"][])
      .map((kind) => {
        const items = backstories.filter((item) => item.kind === kind);
        if (items.length === 0) {
          return "";
        }

        const body = items.map((item) => [
          `### ${item.sortOrder}. ${item.title}`,
          "",
          item.content || "暂无内容",
          ""
        ].join("\n")).join("\n");

        return [`## ${backstoryKindLabelMap[kind]}`, "", body].join("\n");
      })
      .filter(Boolean)
      .join("\n");

    downloadText(`book-${selectedBookId}-backstories.md`, sections, "text/markdown;charset=utf-8");
  }

  async function handleSubmit(payload: BackstoryPayload) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingBackstory) {
        const updated = await updateBackstory(editingBackstory.id, payload);
        setBackstories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingBackstory(null);
      }
      else {
        const created = await createBackstory(payload);
        setBackstories((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交背景故事失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setErrorMessage("");

    try {
      await deleteBackstory(id);
      setBackstories((current) => current.filter((item) => item.id !== id));

      if (editingBackstory?.id === id) {
        setEditingBackstory(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除背景故事失败");
    }
  }

  async function handleGenerate() {
    if (!selectedBookId) {
      setErrorMessage("请先选择作品，再生成背景设定。");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const generated = await generateBackstories({
        ...generateState,
        bookId: selectedBookId
      });
      setBackstories((current) => [...current, ...generated].sort((a, b) => a.sortOrder - b.sortOrder));
      setGenerateState((current) => ({
        ...current,
        prompt: ""
      }));
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI 生成背景设定失败");
    }
    finally {
      setIsGenerating(false);
    }
  }

  const summaryText = useMemo(() => {
    if (loadingBooks) {
      return "正在加载作品与背景设定...";
    }

    const ruleCount = backstories.filter((item) => item.kind === "rule").length;
    return `当前作品下已有 ${backstories.length} 条设定，其中世界规则 ${ruleCount} 条，可作为地图、时间线和大纲的统一底稿。`;
  }, [backstories.length, loadingBooks]);
  const groupedBackstories = useMemo(
    () => (["history", "rule", "culture", "faction", "secret"] as Backstory["kind"][])
      .map((kind) => ({
        kind,
        items: backstories.filter((item) => item.kind === kind)
      }))
      .filter((group) => group.items.length > 0),
    [backstories]
  );
  const aiCount = backstories.filter((item) => item.source === "ai").length;
  const manualCount = backstories.length - aiCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="背景故事与规则"
        description="围绕当前作品集中整理世界观、时代背景、历史秘闻与底层规则，并支持 AI 根据提示词直接生成可编辑设定。"
        status="implemented"
      />

      <SectionCard title="设定卷摘要" description="先把规则和历史沉淀成底稿，再去铺地图、时间线和大纲。">
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-amber-200/10 bg-[linear-gradient(145deg,rgba(120,53,15,0.18),rgba(15,23,42,0.3))] p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200/60">设定摘要</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">这本书的世界观底稿</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/75">
              {summaryText}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-mist/45">设定总数</p>
                <p className="mt-3 text-3xl font-semibold text-white">{backstories.length}</p>
                <p className="mt-2 text-sm text-mist/60">建议按历史、规则、势力、秘密逐层补齐</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-mist/45">AI 生成</p>
                <p className="mt-3 text-3xl font-semibold text-white">{aiCount}</p>
                <p className="mt-2 text-sm text-mist/60">适合快速起稿，后续再人工打磨细节</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-mist/45">手工沉淀</p>
                <p className="mt-3 text-3xl font-semibold text-white">{manualCount}</p>
                <p className="mt-2 text-sm text-mist/60">适合补充关键规则和核心隐藏真相</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(["history", "rule", "culture", "faction", "secret"] as Backstory["kind"][]).map((kind) => {
              const count = backstories.filter((item) => item.kind === kind).length;
              return (
                <div key={kind} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{backstoryKindLabelMap[kind]}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-mist/70">
                      {count} 条
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-mist/65">{backstoryKindDescriptionMap[kind]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="设定书页" description={summaryText}>
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
                  setEditingBackstory(null);
                  setGenerateState((current) => ({
                    ...current,
                    bookId: Number.isNaN(value) ? 0 : value
                  }));
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

          {loadingBackstories ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载背景设定...</div>
          ) : (
            <div className="space-y-4">
              {groupedBackstories.map((group, groupIndex) => (
                <section key={group.kind} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-accent/70">卷 {groupIndex + 1}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{backstoryKindLabelMap[group.kind]}</h3>
                      <p className="mt-2 text-sm text-mist/65">{backstoryKindDescriptionMap[group.kind]}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/65">
                        共 {group.items.length} 条
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleKind(group.kind)}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/70 transition hover:bg-white/[0.08]"
                      >
                        {collapsedKinds.has(group.kind) ? "展开" : "折叠"}
                      </button>
                    </div>
                  </div>

                  {collapsedKinds.has(group.kind) ? (
                    <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                      当前分卷已折叠（{group.items.length} 条），点击右上角“展开”查看。
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {group.items.map((item) => (
                        <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs uppercase tracking-[0.28em] text-accent/70">设定 {item.sortOrder}</p>
                                <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                                  {backstoryKindLabelMap[item.kind]}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-mist/65">
                                  {item.source === "ai" ? "AI 生成" : "手工录入"}
                                </span>
                              </div>
                              <h4 className="mt-3 text-lg font-medium text-white">{item.title}</h4>
                              <p className="mt-3 text-sm leading-7 text-mist/65 whitespace-pre-wrap">{item.content || "暂无设定内容"}</p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/65">
                              {item.bookName}
                            </div>
                          </div>

                          <div className="mt-4 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setEditingBackstory(item)}
                              className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                            >
                              编辑
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
                  )}
                </section>
              ))}

              {!loadingBackstories && backstories.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                  当前作品还没有背景故事设定，先在右侧补一条世界观或历史设定。
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard title="AI 设定生成台" description="输入提示词后，AI 会同时生成背景故事与规则，并直接落到当前作品下。">
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                {promptTemplates.map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    onClick={() => setGenerateState((current) => ({
                      ...current,
                      prompt: template.prompt,
                      focus: template.focus
                    }))}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-accent/30 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-medium text-white">{template.label}</p>
                    <p className="mt-2 text-xs leading-6 text-mist/60">{template.focus}</p>
                  </button>
                ))}
              </div>

              <label className="grid gap-2 text-sm text-mist/70">
                生成提示词
                <textarea
                  value={generateState.prompt}
                  onChange={(event) => setGenerateState((current) => ({ ...current, prompt: event.target.value }))}
                  className="min-h-[150px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：生成一个带宗门体系、禁忌法则、古代王朝断层和海上贸易版图的玄幻世界，要求有 2 条不可违背的硬规则。"
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                重点方向
                <input
                  value={generateState.focus}
                  onChange={(event) => setGenerateState((current) => ({ ...current, focus: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：强调世界规则、重大历史和势力版图"
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                生成条数
                <select
                  value={generateState.count}
                  onChange={(event) => setGenerateState((current) => ({ ...current, count: Number(event.target.value) }))}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                >
                  <option value={1}>1 条</option>
                  <option value={2}>2 条</option>
                  <option value={3}>3 条</option>
                  <option value={4}>4 条</option>
                  <option value={5}>5 条</option>
                  <option value={6}>6 条</option>
                  <option value={7}>7 条</option>
                  <option value={8}>8 条</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating || !selectedBookId}
                className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "AI 生成中..." : "根据提示词生成背景故事与规则"}
              </button>
            </div>
          </SectionCard>

          <SectionCard title="导出与审计" description="导出设定集到本地文件，并查看最近的编辑与 AI 生成记录。">
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
                  onClick={exportMarkdown}
                  disabled={!selectedBookId}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  导出 Markdown
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
                          const data = await getAuditLogs({ bookId: selectedBookId, entityType: "backstory", limit: 50 });
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

          <SectionCard title="背景设定编辑区" description="建议先沉淀世界规则、势力结构、时代背景和关键历史节点，再延展到地图、时间线和大纲。">
            <BackstoryForm
              books={books}
              editingBackstory={editingBackstory}
              isSubmitting={isSubmitting}
              lockedBookId={lockedBookId}
              onSubmit={handleSubmit}
              onCancelEdit={() => setEditingBackstory(null)}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
