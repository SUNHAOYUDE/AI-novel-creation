import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getBooks } from "@/features/books/api";
import { ChapterForm } from "@/features/chapters/ChapterForm";
import { createChapter, deleteChapter, generateChapterAi, getChapters, updateChapter } from "@/features/chapters/api";
import type { ChapterAiMode, ChapterPayload, GenerateChapterAiResult, Book, Chapter } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export function ChaptersPage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [draft, setDraft] = useState<ChapterPayload>({
    bookId: lockedBookId ?? 0,
    chapterNo: 1,
    title: "",
    content: "",
    status: "draft"
  });
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveKeyRef = useRef<string>("");

  const [aiMode, setAiMode] = useState<ChapterAiMode>("continue");
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiResult, setAiResult] = useState<GenerateChapterAiResult | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      setLoadingBooks(true);
      setErrorMessage("");

      try {
        const data = await getBooks();
        setBooks(data);
        const nextBookId = lockedBookId ?? data[0]?.id ?? null;
        setSelectedBookId(nextBookId);
        setDraft((current) => ({
          ...current,
          bookId: nextBookId ?? 0
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
      setChapters([]);
      return;
    }

    async function loadChapters() {
      setLoadingChapters(true);
      setErrorMessage("");

      try {
        const data = await getChapters(selectedBookId);
        setChapters(data);

        const chapterIdParam = searchParams.get("chapterId");
        const chapterId = chapterIdParam ? Number(chapterIdParam) : null;
        if (chapterId && Number.isFinite(chapterId)) {
          const target = data.find((item) => item.id === chapterId) ?? null;
          if (target) {
            setEditingChapter(target);
          }
          setSearchParams((currentParams) => {
            const next = new URLSearchParams(currentParams);
            next.delete("chapterId");
            return next;
          }, { replace: true });
        }
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载章节失败");
      }
      finally {
        setLoadingChapters(false);
      }
    }

    void loadChapters();
  }, [searchParams, selectedBookId, setSearchParams]);

  useEffect(() => {
    if (!selectedBookId) {
      return;
    }

    if (editingChapter) {
      return;
    }

    const nextChapterNo = chapters.length === 0 ? 1 : Math.max(...chapters.map((item) => item.chapterNo)) + 1;
    setDraft((current) => ({
      ...current,
      bookId: selectedBookId,
      chapterNo: current.chapterNo === nextChapterNo ? current.chapterNo : nextChapterNo
    }));
  }, [chapters, editingChapter, selectedBookId]);

  useEffect(() => {
    if (!editingChapter) {
      setAutosaveStatus("idle");
      autosaveKeyRef.current = "";
      setAiResult(null);
      return;
    }

    setDraft({
      bookId: editingChapter.bookId,
      chapterNo: editingChapter.chapterNo,
      title: editingChapter.title,
      content: editingChapter.content,
      status: editingChapter.status
    });
    setAutosaveStatus("saved");
    autosaveKeyRef.current = JSON.stringify({
      bookId: editingChapter.bookId,
      chapterNo: editingChapter.chapterNo,
      title: editingChapter.title,
      content: editingChapter.content,
      status: editingChapter.status
    });
    setAiResult(null);
    setAiInstruction("");
  }, [editingChapter]);

  useEffect(() => {
    if (!editingChapter) {
      return;
    }

    const key = JSON.stringify(draft);
    if (key === autosaveKeyRef.current) {
      setAutosaveStatus("saved");
      return;
    }

    setAutosaveStatus("dirty");

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(async () => {
      if (!editingChapter) {
        return;
      }

      setAutosaveStatus("saving");
      try {
        const updated = await updateChapter(editingChapter.id, draft);
        autosaveKeyRef.current = JSON.stringify(draft);
        setAutosaveStatus("saved");
        setChapters((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingChapter(updated);
      }
      catch (error) {
        setAutosaveStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "自动保存失败");
      }
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [draft, editingChapter]);

  async function handleSubmit(payload: ChapterPayload) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingChapter) {
        const updated = await updateChapter(editingChapter.id, payload);
        setChapters((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingChapter(updated);
        setSelectedBookId(updated.bookId);
        autosaveKeyRef.current = JSON.stringify(payload);
        setAutosaveStatus("saved");
      }
      else {
        const created = await createChapter(payload);
        setSelectedBookId(created.bookId);
        setChapters((current) => (
          created.bookId === selectedBookId ? [...current, created].sort((a, b) => a.chapterNo - b.chapterNo) : current
        ));
        setEditingChapter(created);
        autosaveKeyRef.current = JSON.stringify(payload);
        setAutosaveStatus("saved");
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
        setAiResult(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除章节失败");
    }
  }

  async function handleGenerateAi() {
    if (!selectedBookId) {
      setErrorMessage("请先选择作品");
      return;
    }

    if (!draft.content.trim()) {
      setErrorMessage("请先填写章节正文或草稿，再使用 AI。");
      return;
    }

    setAiGenerating(true);
    setErrorMessage("");

    try {
      const result = await generateChapterAi({
        bookId: selectedBookId,
        chapterId: editingChapter?.id,
        chapterNo: draft.chapterNo,
        title: draft.title,
        mode: aiMode,
        instruction: aiInstruction.trim() || undefined,
        content: draft.content
      });
      setAiResult(result);
    }
    catch (error) {
      setAiResult(null);
      setErrorMessage(error instanceof Error ? error.message : "AI 生成失败");
    }
    finally {
      setAiGenerating(false);
    }
  }

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
                    setAiResult(null);
                    setAutosaveStatus("idle");
                    setDraft((current) => ({
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

        <div className="grid gap-6">
          <SectionCard title="正文编辑区" description="支持自动保存，避免长篇写作时丢稿。">
            <ChapterForm
              books={books}
              editingChapter={editingChapter}
              isSubmitting={isSubmitting}
              lockedBookId={lockedBookId}
              value={draft}
              autosaveStatus={editingChapter ? autosaveStatus : "idle"}
              onChange={setDraft}
              onSubmit={handleSubmit}
              onCancelEdit={() => setEditingChapter(null)}
            />
          </SectionCard>

          <SectionCard title="章节 AI 助手" description="续写、润色与改写都在这里完成，生成结果可一键合并进正文。">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-mist/70">
                  模式
                  <select
                    value={aiMode}
                    onChange={(event) => setAiMode(event.target.value as ChapterAiMode)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  >
                    <option value="continue">续写</option>
                    <option value="polish">润色</option>
                    <option value="rewrite">改写</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-mist/70">
                  额外要求（可选）
                  <input
                    value={aiInstruction}
                    onChange={(event) => setAiInstruction(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                    placeholder="例如：加强对话张力、增加环境压迫感、缩短冗余描写"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => void handleGenerateAi()}
                disabled={aiGenerating || !selectedBookId}
                className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiGenerating ? "生成中..." : "生成文本"}
              </button>

              {aiResult ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-accent/70">AI 输出</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-mist/70">{aiResult.text}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setDraft((current) => ({
                        ...current,
                        content: current.content.trim()
                          ? `${current.content.replace(/\s+$/g, "")}\n\n${aiResult.text}`
                          : aiResult.text
                      }))}
                      className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                    >
                      追加到正文
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((current) => ({
                        ...current,
                        content: aiResult.text
                      }))}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                    >
                      替换正文
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                  先在上方选择模式并生成文本，然后再决定追加或替换到正文里。
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
