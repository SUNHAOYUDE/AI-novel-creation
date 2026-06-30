import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBooks } from "@/features/books/api";
import { generateOutlines, getOutlines } from "@/features/outlines/api";
import type { Book, GenerateOutlinePayload, Outline } from "@/shared/types";
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
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingOutlines, setLoadingOutlines] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBookId) {
      setErrorMessage("请先创建作品，再生成大纲。");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const data = await generateOutlines({
        ...formState,
        bookId: selectedBookId
      });
      setOutlines(data);
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成大纲失败");
    }
    finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="大纲管理"
        description="这里承接总纲、卷纲、章纲与大纲流畅性检查，当前已接入 AI 大纲生成初版。"
        status="implemented"
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard title="大纲骨架" description="当前展示数据库中的真实大纲数据。">
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {loadingOutlines ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载大纲...</div>
          ) : null}

          <div className="space-y-4">
            {groupedOutlines.global.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-accent/70">{item.level}</p>
                    <h3 className="mt-2 text-base font-medium text-white">{item.title}</h3>
                  </div>
                  <StatusBadge>{item.status}</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-mist/65">{item.summary}</p>
              </div>
            ))}

            {groupedOutlines.volume.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-accent/70">{item.level}</p>
                    <h3 className="mt-2 text-base font-medium text-white">{item.title}</h3>
                  </div>
                  <StatusBadge>{item.status}</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-mist/65">{item.summary}</p>
              </div>
            ))}

            {groupedOutlines.chapter.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-accent/70">{item.level}</p>
                    <h3 className="mt-2 text-base font-medium text-white">{item.title}</h3>
                  </div>
                  <StatusBadge>{item.status}</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-mist/65">{item.summary}</p>
              </div>
            ))}

            {!loadingOutlines && outlines.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-mist/65">
                当前作品还没有大纲，先在右侧输入创作需求并生成。
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="AI 生成面板" description="基于作品信息和创作要求，调用 DeepSeek 生成初版总纲、卷纲和章纲。">
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
              disabled={submitting || books.length === 0}
              className="w-full rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "AI 生成中..." : "生成并覆盖当前作品大纲"}
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
              <p className="text-sm text-white">后续可扩展</p>
              <p className="mt-2 text-sm text-mist/65">下一步可继续接入大纲流畅性检查、逻辑冲突扫描和人工微调保存。</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
