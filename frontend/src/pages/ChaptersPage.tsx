import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBooks } from "@/features/books/api";
import { ChapterForm } from "@/features/chapters/ChapterForm";
import { createChapter, deleteChapter, getChapters, updateChapter } from "@/features/chapters/api";
import type { Book, Chapter, ChapterPayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export function ChaptersPage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function bootstrap() {
      setLoadingBooks(true);
      setErrorMessage("");

      try {
        const data = await getBooks();
        setBooks(data);
        setSelectedBookId(lockedBookId ?? data[0]?.id ?? null);
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
      setChapters([]);
      return;
    }

    async function loadChapters() {
      setLoadingChapters(true);
      setErrorMessage("");

      try {
        const data = await getChapters(selectedBookId);
        setChapters(data);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载章节失败");
      }
      finally {
        setLoadingChapters(false);
      }
    }

    void loadChapters();
  }, [selectedBookId]);

  async function handleSubmit(payload: ChapterPayload) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingChapter) {
        const updated = await updateChapter(editingChapter.id, payload);
        setChapters((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingChapter(updated);
        setSelectedBookId(updated.bookId);
      }
      else {
        const created = await createChapter(payload);
        setSelectedBookId(created.bookId);
        setChapters((current) => (
          created.bookId === selectedBookId ? [...current, created].sort((a, b) => a.chapterNo - b.chapterNo) : current
        ));
        setEditingChapter(created);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交章节失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setErrorMessage("");

    try {
      await deleteChapter(id);
      setChapters((current) => current.filter((item) => item.id !== id));

      if (editingChapter?.id === id) {
        setEditingChapter(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除章节失败");
    }
  }

  const nextChapterNo = useMemo(() => {
    if (chapters.length === 0) {
      return 1;
    }

    return Math.max(...chapters.map((item) => item.chapterNo)) + 1;
  }, [chapters]);

  const summaryText = useMemo(() => {
    if (loadingBooks) {
      return "正在加载作品与章节数据...";
    }

    return `当前作品下已有 ${chapters.length} 个章节，编辑区已接通真实接口与数据库。`;
  }, [chapters.length, loadingBooks]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="章节工作台"
        description="用于承接章节目录、正文编辑、状态维护和后续的一致性检查、局部重写能力。"
        status="implemented"
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="章节目录" description={summaryText}>
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-4">
            {!lockedBookId ? (
              <label className="grid gap-2 text-sm text-mist/70">
                当前查看作品
                <select
                  value={selectedBookId ?? ""}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setSelectedBookId(Number.isNaN(value) ? null : value);
                    setEditingChapter(null);
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

            {loadingChapters ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载章节目录...</div>
            ) : (
              <div className="space-y-4">
                {chapters.map((item) => (
                  <div
                    key={item.id}
                    className={[
                      "rounded-3xl border bg-white/[0.03] p-5 transition",
                      editingChapter?.id === item.id ? "border-accent/40" : "border-white/10"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-accent/70">Chapter {item.chapterNo}</p>
                        <h3 className="mt-2 text-base font-medium text-white">{item.title}</h3>
                        <p className="mt-2 text-sm text-mist/65">字数：{item.wordCount}</p>
                        <p className="mt-1 text-xs text-mist/45">更新时间：{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "暂无"}</p>
                      </div>
                      <StatusBadge>{item.status}</StatusBadge>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingChapter(item)}
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
                  </div>
                ))}

                {!loadingChapters && chapters.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                    当前作品还没有章节，先在右侧创建第一个章节。
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="编辑与检查区" description="当前已接入真实编辑保存；一致性、节奏和伏笔检查仍作为后续扩展入口保留。">
          <div className="grid gap-4">
            <ChapterForm
              books={books}
              editingChapter={editingChapter}
              nextChapterNo={nextChapterNo}
              isSubmitting={isSubmitting}
              lockedBookId={lockedBookId}
              onSubmit={handleSubmit}
              onCancelEdit={() => setEditingChapter(null)}
            />
            <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
              {editingChapter
                ? `当前正在编辑 ${editingChapter.bookName} - Chapter ${editingChapter.chapterNo}。后续可在这里继续接入一致性、节奏、风格和伏笔检查。`
                : "选择左侧章节后可继续扩展 AI 检查、局部重写和版本对比能力。"}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
