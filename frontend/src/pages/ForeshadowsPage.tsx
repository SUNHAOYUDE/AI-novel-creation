import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBooks } from "@/features/books/api";
import { ForeshadowForm } from "@/features/foreshadows/ForeshadowForm";
import { createForeshadow, deleteForeshadow, getForeshadows, updateForeshadow } from "@/features/foreshadows/api";
import type { Book, Foreshadow, ForeshadowPayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export function ForeshadowsPage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [foreshadows, setForeshadows] = useState<Foreshadow[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [editingForeshadow, setEditingForeshadow] = useState<Foreshadow | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingForeshadows, setLoadingForeshadows] = useState(false);
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
      setForeshadows([]);
      return;
    }

    async function loadForeshadows() {
      setLoadingForeshadows(true);
      setErrorMessage("");

      try {
        const data = await getForeshadows(selectedBookId);
        setForeshadows(data);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载伏笔失败");
      }
      finally {
        setLoadingForeshadows(false);
      }
    }

    void loadForeshadows();
  }, [selectedBookId]);

  async function handleSubmit(payload: ForeshadowPayload) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingForeshadow) {
        const updated = await updateForeshadow(editingForeshadow.id, payload);
        setForeshadows((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingForeshadow(null);
        setSelectedBookId(updated.bookId);
      }
      else {
        const created = await createForeshadow(payload);
        setSelectedBookId(created.bookId);
        setForeshadows((current) => (
          created.bookId === selectedBookId ? [created, ...current] : current
        ));
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交伏笔失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setErrorMessage("");

    try {
      await deleteForeshadow(id);
      setForeshadows((current) => current.filter((item) => item.id !== id));

      if (editingForeshadow?.id === id) {
        setEditingForeshadow(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除伏笔失败");
    }
  }

  const summaryText = useMemo(() => {
    if (loadingBooks) {
      return "正在加载作品与伏笔数据...";
    }

    return `当前作品下已有 ${foreshadows.length} 条伏笔，页面已接通真实接口与数据库。`;
  }, [foreshadows.length, loadingBooks]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="伏笔与情节"
        description="用于承接伏笔管理、关键桥段、特殊情节和回收进度等结构化能力。"
        status="implemented"
      />

      <SectionCard title="伏笔创建与列表" description={summaryText}>
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-5">
          <ForeshadowForm
            books={books}
            editingForeshadow={editingForeshadow}
            isSubmitting={isSubmitting}
            lockedBookId={lockedBookId}
            onSubmit={handleSubmit}
            onCancelEdit={() => setEditingForeshadow(null)}
          />

          {!lockedBookId ? (
            <label className="grid gap-2 text-sm text-mist/70">
              当前查看作品
              <select
                value={selectedBookId ?? ""}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setSelectedBookId(Number.isNaN(value) ? null : value);
                  setEditingForeshadow(null);
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

          {loadingForeshadows ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载伏笔列表...</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {foreshadows.map((item) => (
                <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-medium text-white">{item.title}</h3>
                        <span className="text-xs text-mist/45">{item.bookName}</span>
                      </div>
                      <p className="mt-2 text-sm text-mist/65">{item.realIntent || "暂无真实意图说明"}</p>
                    </div>
                    <StatusBadge>{item.status}</StatusBadge>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-mist/45">表面信息</p>
                      <p className="mt-1 text-sm text-mist/70">{item.surfaceInfo || "暂无表面信息"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-mist/45">目标回收</p>
                      <p className="mt-1 text-sm text-mist/70">{item.targetPayoff || "暂无回收节点"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-mist/45">更新时间</p>
                      <p className="mt-1 text-sm text-mist/70">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "暂无"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingForeshadow(item)}
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
                </article>
              ))}

              {!loadingForeshadows && foreshadows.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                  当前作品还没有伏笔，先在上方创建一条伏笔。
                </div>
              ) : null}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
