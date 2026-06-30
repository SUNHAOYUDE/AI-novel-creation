import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Backstory, BackstoryPayload, Book } from "@/shared/types";

const defaultState: BackstoryPayload = {
  bookId: 0,
  kind: "history",
  title: "",
  content: "",
  sortOrder: 1
};

type BackstoryFormProps = {
  books: Book[];
  editingBackstory: Backstory | null;
  isSubmitting: boolean;
  lockedBookId?: number | null;
  onSubmit: (payload: BackstoryPayload) => Promise<void>;
  onCancelEdit: () => void;
};

export function BackstoryForm({
  books,
  editingBackstory,
  isSubmitting,
  lockedBookId,
  onSubmit,
  onCancelEdit
}: BackstoryFormProps) {
  const initialState = useMemo<BackstoryPayload>(() => ({
    ...defaultState,
    bookId: lockedBookId ?? books[0]?.id ?? 0
  }), [books, lockedBookId]);

  const [formState, setFormState] = useState<BackstoryPayload>(initialState);

  useEffect(() => {
    if (!editingBackstory) {
      setFormState(initialState);
      return;
    }

    setFormState({
      bookId: editingBackstory.bookId,
      kind: editingBackstory.kind,
      title: editingBackstory.title,
      content: editingBackstory.content,
      sortOrder: editingBackstory.sortOrder
    });
  }, [editingBackstory, initialState]);

  useEffect(() => {
    if (!lockedBookId) {
      return;
    }

    setFormState((current) => ({
      ...current,
      bookId: lockedBookId
    }));
  }, [lockedBookId]);

  function updateField<Key extends keyof BackstoryPayload>(key: Key, value: BackstoryPayload[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(formState);

    if (!editingBackstory) {
      setFormState(initialState);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-mist/70">
          设定类型
          <select
            value={formState.kind}
            onChange={(event) => updateField("kind", event.target.value as BackstoryPayload["kind"])}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          >
            <option value="history">背景故事</option>
            <option value="rule">世界规则</option>
            <option value="culture">文化设定</option>
            <option value="faction">势力结构</option>
            <option value="secret">隐藏真相</option>
          </select>
        </label>

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
        ) : (
          <div />
        )}

        <label className="grid gap-2 text-sm text-mist/70">
          设定顺序
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
        标题
        <input
          value={formState.title}
          onChange={(event) => updateField("title", event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="例如：世界观底层规则 / 王朝历史 / 主角家族秘闻"
          required
        />
      </label>

      <label className="grid gap-2 text-sm text-mist/70">
        背景内容
        <textarea
          value={formState.content}
          onChange={(event) => updateField("content", event.target.value)}
          className="min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="输入这条背景故事的详细设定，可用于承载世界观、时代背景、历史事件、势力结构等。"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting || (!lockedBookId && books.length === 0)}
          className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : editingBackstory ? "保存设定" : "创建设定"}
        </button>

        {editingBackstory ? (
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
