import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookWorkspaceNavItems, getBookWorkspacePath } from "@/app/routes";
import { BookForm } from "@/features/books/BookForm";
import { createBook, deleteBook, getBooks, updateBook } from "@/features/books/api";
import type { Book, BookPayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadBooks() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await getBooks();
      setBooks(data);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "加载作品失败";
      setErrorMessage(message);
    }
    finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBooks();
  }, []);

  async function handleSubmit(payload: BookPayload) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingBook) {
        const updated = await updateBook(editingBook.id, payload);
        setBooks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingBook(null);
      }
      else {
        const created = await createBook(payload);
        setBooks((current) => [created, ...current]);
      }
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "提交失败";
      setErrorMessage(message);
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setErrorMessage("");

    try {
      await deleteBook(id);
      setBooks((current) => current.filter((item) => item.id !== id));

      if (editingBook?.id === id) {
        setEditingBook(null);
      }
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "删除失败";
      setErrorMessage(message);
    }
  }

  const summaryText = useMemo(() => {
    if (isLoading) {
      return "正在从后端读取作品数据...";
    }

    return `当前已接入 ${books.length} 本作品，页面已从 mock 切换到真实接口。`;
  }, [books.length, isLoading]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="作品管理"
        description="用于承接作品列表、基础信息、类型、创作阶段、作品 DNA 卡等核心档案能力。"
        actionLabel="作品 CRUD 已接通"
        status="implemented"
      />

      <SectionCard title="创建与编辑" description={summaryText}>
        <BookForm editingBook={editingBook} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancelEdit={() => setEditingBook(null)} />
      </SectionCard>

      <SectionCard title="作品列表" description="这里展示后端真实返回的数据，并支持编辑与删除。">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-mist/65">正在加载作品列表...</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {books.map((book) => (
              <article key={book.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">{book.name}</h3>
                    <p className="mt-2 text-sm text-mist/65">{book.description || "暂无简介"}</p>
                  </div>
                  <StatusBadge>{book.status}</StatusBadge>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-mist/45">主类型</p>
                    <p className="mt-2 text-sm text-white">{book.category}</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-mist/45">子类型</p>
                    <p className="mt-2 text-sm text-white">{book.subCategory || "未设置"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-mist/45">更新时间</p>
                    <p className="mt-2 text-sm text-white">{book.updatedAt ? new Date(book.updatedAt).toLocaleString() : "暂无"}</p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Link
                    to={`/books/${book.id}`}
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    进入工作区
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditingBook(book)}
                    className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(book.id)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                  >
                    删除
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-mist/45">书内模块层级</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bookWorkspaceNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={getBookWorkspacePath(book.id, item.path)}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist/75 transition hover:border-accent/30 hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
