import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Book, Outline, OutlinePayload } from "@/shared/types";

const defaultState: OutlinePayload = {
  bookId: 0,
  level: "global",
  title: "",
  summary: "",
  status: "draft",
  sortOrder: 1
};

type OutlineFormProps = {
  books: Book[];
  editingOutline: Outline | null;
  isSubmitting: boolean;
  lockedBookId?: number | null;
  nextSortOrder: number;
  onSubmit: (payload: OutlinePayload) => Promise<void>;
  onCancelEdit: () => void;
};

export function OutlineForm({
  books,
  editingOutline,
  isSubmitting,
  lockedBookId,
  nextSortOrder,
  onSubmit,
  onCancelEdit
}: OutlineFormProps) {
  const initialState = useMemo<OutlinePayload>(() => ({
    ...defaultState,
    bookId: lockedBookId ?? books[0]?.id ?? 0,
    sortOrder: nextSortOrder
  }), [books, lockedBookId, nextSortOrder]);

  const [formState, setFormState] = useState<OutlinePayload>(initialState);

  useEffect(() => {
    if (!editingOutline) {
      setFormState(initialState);
      return;
    }

    setFormState({
      bookId: editingOutline.bookId,
      level: editingOutline.level,
      title: editingOutline.title,
      summary: editingOutline.summary ?? "",
      status: editingOutline.status ?? "draft",
      sortOrder: editingOutline.sortOrder ?? 0
    });
  }, [editingOutline, initialState]);

  useEffect(() => {
    if (!lockedBookId) {
      return;
    }

    setFormState((current) => ({
      ...current,
      bookId: lockedBookId
    }));
  }, [lockedBookId]);

  function updateField<Key extends keyof OutlinePayload>(key: Key, value: OutlinePayload[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(formState);

    if (!editingOutline) {
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
          层级
          <select
            value={formState.level}
            onChange={(event) => updateField("level", event.target.value as OutlinePayload["level"])}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          >
            <option value="global">总纲</option>
            <option value="volume">卷纲</option>
            <option value="chapter">章纲</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm text-mist/70">
        标题
        <input
          value={formState.title}
          onChange={(event) => updateField("title", event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="例如：总纲 / 第一卷 / 第 1 章"
          required
        />
      </label>

      <label className="grid gap-2 text-sm text-mist/70">
        摘要
        <textarea
          value={formState.summary}
          onChange={(event) => updateField("summary", event.target.value)}
          className="min-h-[160px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="用 3-8 句话写清这一层的剧情推进、冲突与伏笔。"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-mist/70">
          状态
          <select
            value={formState.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          >
            <option value="draft">草稿</option>
            <option value="generated">AI 初稿</option>
            <option value="refining">细化中</option>
            <option value="final">定稿</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-mist/70">
          排序号
          <input
            type="number"
            min={0}
            value={formState.sortOrder}
            onChange={(event) => updateField("sortOrder", Number(event.target.value))}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting || (!lockedBookId && books.length === 0)}
          className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : editingOutline ? "保存修改" : "新增大纲条目"}
        </button>

        {editingOutline ? (
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

