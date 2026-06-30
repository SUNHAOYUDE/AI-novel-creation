import type { FormEvent } from "react";
import type { Book, Chapter, ChapterPayload } from "@/shared/types";

type ChapterFormProps = {
  books: Book[];
  editingChapter: Chapter | null;
  isSubmitting: boolean;
  lockedBookId?: number | null;
  value: ChapterPayload;
  autosaveStatus?: "idle" | "dirty" | "saving" | "saved" | "error";
  onChange: (next: ChapterPayload) => void;
  onSubmit: (payload: ChapterPayload) => Promise<void>;
  onCancelEdit: () => void;
};

export function ChapterForm({
  books,
  editingChapter,
  isSubmitting,
  lockedBookId,
  value,
  autosaveStatus,
  onChange,
  onSubmit,
  onCancelEdit
}: ChapterFormProps) {
  const valueState = value;

  function updateField<Key extends keyof ChapterPayload>(key: Key, value: ChapterPayload[Key]) {
    onChange({
      ...valueState,
      [key]: value
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(valueState);
  }

  const autosaveLabelMap: Record<NonNullable<ChapterFormProps["autosaveStatus"]>, string> = {
    idle: "",
    dirty: "未保存",
    saving: "保存中...",
    saved: "已保存",
    error: "保存失败"
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        {!lockedBookId ? (
          <label className="grid gap-2 text-sm text-mist/70">
            所属作品
            <select
              value={valueState.bookId}
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
            value={valueState.chapterNo}
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
            value={valueState.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="输入章节标题"
            required
          />
        </label>
        <label className="grid gap-2 text-sm text-mist/70">
          状态
          <select
            value={valueState.status}
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
          value={valueState.content}
          onChange={(event) => updateField("content", event.target.value)}
          className="min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="输入章节正文或章节草稿"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || (!lockedBookId && books.length === 0)}
          className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : editingChapter ? "保存章节" : "创建章节"}
        </button>

        {autosaveStatus && autosaveStatus !== "idle" ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/65">
            {autosaveLabelMap[autosaveStatus]}
          </span>
        ) : null}

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
