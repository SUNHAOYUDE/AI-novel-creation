import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { bookWorkspaceNavItems, getBookWorkspacePath } from "@/app/routes";
import { getBook } from "@/features/books/api";
import type { Book } from "@/shared/types";
import { FeatureStatusBadge } from "@/shared/ui/FeatureStatusBadge";

function getWorkspaceLinkClassName(isActive: boolean) {
  return [
    "group flex items-start gap-3 rounded-2xl border px-4 py-3 transition",
    isActive
      ? "border-accent/40 bg-accent/10 text-white"
      : "border-white/10 bg-white/[0.03] text-mist/75 hover:border-white/20 hover:bg-white/[0.06]"
  ].join(" ");
}

export function BookWorkspaceLayout() {
  const location = useLocation();
  const params = useParams();
  const bookId = Number(params.bookId);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const activeWorkspaceItem = bookWorkspaceNavItems.find((item) => location.pathname.endsWith(`/${item.path}`));
  const currentLabel = activeWorkspaceItem?.label ?? "总览";
  const bookStatusLabelMap: Record<string, string> = {
    draft: "草稿",
    planning: "规划中",
    active: "进行中",
    paused: "暂停",
    completed: "已完结"
  };

  useEffect(() => {
    if (!Number.isFinite(bookId)) {
      setErrorMessage("无效的作品编号");
      setLoading(false);
      return;
    }

    async function loadBook() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getBook(bookId);
        setBook(data);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载作品信息失败");
      }
      finally {
        setLoading(false);
      }
    }

    void loadBook();
  }, [bookId]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-mist/60">
          <Link to="/books" className="transition hover:text-white">
            作品管理
          </Link>
          <span>/</span>
          <Link to={`/books/${bookId}`} className="transition hover:text-white">
            {loading ? "当前作品" : book?.name ?? "作品工作区"}
          </Link>
          <span>/</span>
          <span className="text-white">{currentLabel}</span>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-accent/70">书内工作区</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">
                {loading ? "正在加载作品..." : book?.name ?? "作品工作区"}
              </h1>
              <FeatureStatusBadge status="implemented" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist/70">
                当前模块：{currentLabel}
              </span>
            </div>
            <p className="max-w-3xl text-sm text-mist/70">
              {errorMessage || book?.description || "围绕当前作品集中管理背景故事、大纲、角色、伏笔和章节。"}
            </p>
          </div>

          {book ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-mist/45">主类型</p>
                <p className="mt-2 text-sm text-white">{book.category}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-mist/45">子类型</p>
                <p className="mt-2 text-sm text-white">{book.subCategory || "未设置"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-mist/45">阶段</p>
                <p className="mt-2 text-sm text-white">{bookStatusLabelMap[book.status] ?? book.status}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-mist/65">
            当前工作区已锁定在本书，下面所有模块都只操作这一本作品。
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <Link
              to={`/books/${bookId}`}
              className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent transition hover:bg-accent/20"
            >
              书内总览
            </Link>
            <Link
              to="/books"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-mist/80 transition hover:bg-white/[0.08]"
            >
              返回作品列表
            </Link>
          </div>

          <nav className="space-y-3">
            {bookWorkspaceNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={getBookWorkspacePath(bookId, item.path)}
                  className={({ isActive }) => getWorkspaceLinkClassName(isActive)}
                >
                  <span className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <FeatureStatusBadge status={item.status} compact />
                    </span>
                    <span className="block text-xs text-mist/55">{item.description}</span>
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div>
          <Outlet />
        </div>
      </section>
    </div>
  );
}
