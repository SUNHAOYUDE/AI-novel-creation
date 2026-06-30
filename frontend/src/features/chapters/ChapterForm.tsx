import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Book, Chapter, ChapterPayload } from "@/shared/types";

const defaultState: ChapterPayload = {
  bookId: 0,
  chapterNo: 1,
  title: "",
  content: "",
  status: "draft"
};

type ChapterFormProps = {
  books: Book[];
  editingChapter: Chapter | null;
  nextChapterNo: number;
  isSubmitting: boolean;
  lockedBookId?: number | null;
  onSubmit: (payload: ChapterPayload) => Promise<void>;
  onCancelEdit: () => void;
};

export function ChapterForm({
  books,
  editingChapter,
  nextChapterNo,
  isSubmitting,
  lockedBookId,
  onSubmit,
  onCancelEdit
}: ChapterFormProps) {
  const initialState = useMemo<ChapterPayload>(() => ({
    ...defaultState,
    bookId: lockedBookId ?? books[0]?.id ?? 0,
    chapterNo: nextChapterNo
  }), [books, nextChapterNo, lockedBookId]);

  const [formState, setFormState] = useState<ChapterPayload>(initialState);

  useEffect(() => {
    if (!editingChapter) {
      setFormState(initialState);
      return;
    }

    setFormState({
      bookId: editingChapter.bookId,
      chapterNo: editingChapter.chapterNo,
      title: editingChapter.title,
      content: editingChapter.content,
      status: editingChapter.status
    });
  }, [editingChapter, initialState]);

  useEffect(() => {
    if (!lockedBookId) {
      return;
    }

    setFormState((current) => ({
      ...current,
      bookId: lockedBookId
    }));
  }, [lockedBookId]);

  function updateField<Key extends keyof ChapterPayload>(key: Key, value: ChapterPayload[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(formState);

    if (!editingChapter) {
      setFormState(initialState);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        {!lockedBookId ? (
          <label className="grid gap-2 text-sm text-mist/70">
            所属作品
            <select
              value={formState.bookId}
              onChange={(event) => updateField("bookId", Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              disabled={books.length === 0}
              required
            >
              {books.length === 0 ? <option value={0}>暂无作品</option> : null}
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm text-mist/70">
          章节序号
          <input
            type="number"
            min={1}
            value={formState.chapterNo}
            onChange={(event) => updateField("chapterNo", Number(event.target.value))}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-mist/70">
          章节标题
          <input
            value={formState.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="输入章节标题"
            required
          />
        </label>
        <label className="grid gap-2 text-sm text-mist/70">
          状态
          <select
            value={formState.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          >
            <option value="draft">草稿</option>
            <option value="reviewing">审阅中</option>
            <option value="polishing">润色中</option>
            <option value="completed">定稿</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm text-mist/70">
        正文内容
        <textarea
          value={formState.content}
          onChange={(event) => updateField("content", event.target.value)}
          className="min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="输入章节正文或章节草稿"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting || (!lockedBookId && books.length === 0)}
          className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : editingChapter ? "保存章节" : "创建章节"}
        </button>

        {editingChapter ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
          >
            取消编辑
          </button>
        ) : null}
      </div>
    </form>
  );
}
