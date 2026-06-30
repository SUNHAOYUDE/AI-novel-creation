import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Book, Foreshadow, ForeshadowPayload } from "@/shared/types";

const defaultState: ForeshadowPayload = {
  bookId: 0,
  title: "",
  surfaceInfo: "",
  realIntent: "",
  targetPayoff: "",
  status: "planned"
};

type ForeshadowFormProps = {
  books: Book[];
  editingForeshadow: Foreshadow | null;
  isSubmitting: boolean;
  lockedBookId?: number | null;
  onSubmit: (payload: ForeshadowPayload) => Promise<void>;
  onCancelEdit: () => void;
};

export function ForeshadowForm({
  books,
  editingForeshadow,
  isSubmitting,
  lockedBookId,
  onSubmit,
  onCancelEdit
}: ForeshadowFormProps) {
  const initialState = useMemo<ForeshadowPayload>(() => ({
    ...defaultState,
    bookId: lockedBookId ?? books[0]?.id ?? 0
  }), [books, lockedBookId]);

  const [formState, setFormState] = useState<ForeshadowPayload>(initialState);

  useEffect(() => {
    if (!editingForeshadow) {
      setFormState(initialState);
      return;
    }

    setFormState({
      bookId: editingForeshadow.bookId,
      title: editingForeshadow.title,
      surfaceInfo: editingForeshadow.surfaceInfo,
      realIntent: editingForeshadow.realIntent,
      targetPayoff: editingForeshadow.targetPayoff,
      status: editingForeshadow.status
    });
  }, [editingForeshadow, initialState]);

  useEffect(() => {
    if (!lockedBookId) {
      return;
    }

    setFormState((current) => ({
      ...current,
      bookId: lockedBookId
    }));
  }, [lockedBookId]);

  function updateField<Key extends keyof ForeshadowPayload>(key: Key, value: ForeshadowPayload[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(formState);

    if (!editingForeshadow) {
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
          伏笔标题
          <input
            value={formState.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="输入伏笔标题"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-mist/70">
          状态
          <select
            value={formState.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          >
            <option value="planned">计划中</option>
            <option value="active">推进中</option>
            <option value="payoff_ready">待回收</option>
            <option value="recycled">已回收</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-mist/70">
          目标回收
          <input
            value={formState.targetPayoff}
            onChange={(event) => updateField("targetPayoff", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="对应章节或回收节点"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-mist/70">
        表面信息
        <textarea
          value={formState.surfaceInfo}
          onChange={(event) => updateField("surfaceInfo", event.target.value)}
          className="min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="读者或角色表面能看到的信息"
        />
      </label>

      <label className="grid gap-2 text-sm text-mist/70">
        真实意图
        <textarea
          value={formState.realIntent}
          onChange={(event) => updateField("realIntent", event.target.value)}
          className="min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="伏笔真正服务的冲突、反转或人物弧线"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting || (!lockedBookId && books.length === 0)}
          className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : editingForeshadow ? "保存伏笔" : "创建伏笔"}
        </button>

        {editingForeshadow ? (
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
