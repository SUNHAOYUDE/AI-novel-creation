import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBooks } from "@/features/books/api";
import { OutlineForm } from "@/features/outlines/OutlineForm";
import { createOutline, deleteOutline, generateOutlines, getOutlines, updateOutline } from "@/features/outlines/api";
import type { Book, GenerateOutlinePayload, Outline, OutlinePayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export function OutlinesPage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [editingOutline, setEditingOutline] = useState<Outline | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingOutlines, setLoadingOutlines] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formState, setFormState] = useState<GenerateOutlinePayload>({
    bookId: 0,
    premise: "",
    targetTone: "节奏快、可读性强、适合连载",
    specialHook: "",
    requirements: "请强化类型感、记忆点、伏笔与冲突递进"
  });

  useEffect(() => {
    async function bootstrap() {
      setLoadingBooks(true);
      setErrorMessage("");

      try {
        const data = await getBooks();
        setBooks(data);

        if (data.length > 0) {
          setSelectedBookId(lockedBookId ?? data[0].id);
          setFormState((current) => ({
            ...current,
            bookId: lockedBookId ?? data[0].id
          }));
        }
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
      setOutlines([]);
      return;
    }

    async function loadOutlines() {
      setLoadingOutlines(true);
      setErrorMessage("");

      try {
        const data = await getOutlines(selectedBookId);
        setOutlines(data);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载大纲失败");
      }
      finally {
        setLoadingOutlines(false);
      }
    }

    void loadOutlines();
  }, [selectedBookId]);

  const groupedOutlines = useMemo(() => ({
    global: outlines.filter((item) => item.level === "global"),
    volume: outlines.filter((item) => item.level === "volume"),
    chapter: outlines.filter((item) => item.level === "chapter")
  }), [outlines]);

  const nextSortOrder = useMemo(() => {
    if (outlines.length === 0) {
      return 1;
    }

    return Math.max(...outlines.map((item) => item.sortOrder)) + 1;
  }, [outlines]);

  async function handleSubmitOutline(payload: OutlinePayload) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingOutline) {
        const updated = await updateOutline(editingOutline.id, payload);
        setOutlines((current) => current.map((item) => (item.id === updated.id ? updated : item)).sort((a, b) => a.sortOrder - b.sortOrder));
        setEditingOutline(null);
      }
      else {
        const created = await createOutline(payload);
        setOutlines((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交大纲失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteOutline(id: number) {
    setErrorMessage("");

    try {
      await deleteOutline(id);
      setOutlines((current) => current.filter((item) => item.id !== id));

      if (editingOutline?.id === id) {
        setEditingOutline(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除大纲失败");
    }
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBookId) {
      setErrorMessage("请先创建作品，再生成大纲。");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const data = await generateOutlines({
        ...formState,
        bookId: selectedBookId
      });
      setOutlines(data);
      setEditingOutline(null);
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成大纲失败");
    }
    finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="大纲管理"
        description="支持手工增删改，以及可选的 AI 生成初版总纲、卷纲和章纲。"
        status="implemented"
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard title="大纲骨架" description="当前展示数据库中的真实大纲数据，可手工编辑。">
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {loadingOutlines ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载大纲...</div>
          ) : null}

          <div className="space-y-4">
            {[...groupedOutlines.global, ...groupedOutlines.volume, ...groupedOutlines.chapter].map((item) => (
              <div
                key={item.id}
                className={[
                  "rounded-3xl border bg-white/[0.03] p-5 transition",
                  editingOutline?.id === item.id ? "border-accent/40" : "border-white/10"
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.28em] text-accent/70">{item.level} · #{item.sortOrder}</p>
                    <h3 className="mt-2 text-base font-medium text-white">{item.title}</h3>
                  </div>
                  <StatusBadge>{item.status}</StatusBadge>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-mist/65">{item.summary || "暂无摘要"}</p>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingOutline(item)}
                    className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteOutline(item.id)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}

            {!loadingOutlines && outlines.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-mist/65">
                当前作品还没有大纲。你可以先在右侧手工新增，也可以使用 AI 生成初版。
              </div>
            ) : null}
          </div>
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard title="手工编辑区" description="不依赖 AI，直接新增/修改大纲条目。">
            <OutlineForm
              books={books}
              editingOutline={editingOutline}
              isSubmitting={isSubmitting}
              lockedBookId={lockedBookId}
              nextSortOrder={nextSortOrder}
              onSubmit={handleSubmitOutline}
              onCancelEdit={() => setEditingOutline(null)}
            />
          </SectionCard>

          <SectionCard title="AI 生成面板（可选）" description="基于作品信息和创作要求，调用 DeepSeek 生成初版总纲、卷纲和章纲。">
            <form className="space-y-4" onSubmit={handleGenerate}>
              {!lockedBookId ? (
                <label className="grid gap-2 text-sm text-mist/70">
                  选择作品
                  <select
                    value={selectedBookId ?? ""}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setSelectedBookId(value);
                      setFormState((current) => ({
                        ...current,
                        bookId: value
                      }));
                    }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                    disabled={loadingBooks || books.length === 0}
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

              <label className="grid gap-2 text-sm text-mist/70">
                创作 premise
                <textarea
                  value={formState.premise}
                  onChange={(event) => setFormState((current) => ({ ...current, premise: event.target.value }))}
                  className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：主角在一座会吞噬记忆的海上城市调查失踪案，逐渐发现自己也是被改写记忆的人。"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                目标风格
                <input
                  value={formState.targetTone}
                  onChange={(event) => setFormState((current) => ({ ...current, targetTone: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：节奏快、悬疑强、适合连载"
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                作品记忆点
                <input
                  value={formState.specialHook}
                  onChange={(event) => setFormState((current) => ({ ...current, specialHook: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：每次风暴来临都会出现不存在的白塔"
                />
              </label>

              <label className="grid gap-2 text-sm text-mist/70">
                附加要求
                <textarea
                  value={formState.requirements}
                  onChange={(event) => setFormState((current) => ({ ...current, requirements: event.target.value }))}
                  className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  placeholder="例如：第一卷埋 3 个伏笔，前 3 章必须有明显钩子。"
                />
              </label>

              <button
                type="submit"
                disabled={isGenerating || books.length === 0}
                className="w-full rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "AI 生成中..." : "生成并覆盖当前作品大纲"}
              </button>
            </form>

            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-white">当前统计</p>
                <p className="mt-2 text-sm text-mist/65">
                  总纲 {groupedOutlines.global.length} 条，卷纲 {groupedOutlines.volume.length} 条，章纲 {groupedOutlines.chapter.length} 条。
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-white">提示</p>
                <p className="mt-2 text-sm text-mist/65">你可以先手工写一个总纲，再用 AI 补卷纲/章纲，或者完全手工维护。</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
