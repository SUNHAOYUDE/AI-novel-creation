import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Book, BookPayload } from "@/shared/types";

const initialState: BookPayload = {
  name: "",
  category: "",
  subCategory: "",
  status: "draft",
  description: ""
};

type BookFormProps = {
  editingBook: Book | null;
  isSubmitting: boolean;
  onSubmit: (payload: BookPayload) => Promise<void>;
  onCancelEdit: () => void;
};

export function BookForm({ editingBook, isSubmitting, onSubmit, onCancelEdit }: BookFormProps) {
  const [formState, setFormState] = useState<BookPayload>(initialState);

  useEffect(() => {
    if (!editingBook) {
      setFormState(initialState);
      return;
    }

    setFormState({
      name: editingBook.name,
      category: editingBook.category,
      subCategory: editingBook.subCategory,
      status: editingBook.status,
      description: editingBook.description
    });
  }, [editingBook]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(formState);

    if (!editingBook) {
      setFormState(initialState);
    }
  }

  function updateField<Key extends keyof BookPayload>(key: Key, value: BookPayload[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-mist/70">
          作品名
          <input
            value={formState.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="输入作品名"
            required
          />
        </label>
        <label className="grid gap-2 text-sm text-mist/70">
          主类型
          <input
            value={formState.category}
            onChange={(event) => updateField("category", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="如：悬疑、科幻"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-mist/70">
          子类型
          <input
            value={formState.subCategory}
            onChange={(event) => updateField("subCategory", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="如：群像、成长流"
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
            <option value="planning">规划中</option>
            <option value="active">进行中</option>
            <option value="paused">暂停</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm text-mist/70">
        简介
        <textarea
          value={formState.description}
          onChange={(event) => updateField("description", event.target.value)}
          className="min-h-[140px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="输入作品简介"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : editingBook ? "保存修改" : "创建作品"}
        </button>

        {editingBook ? (
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
