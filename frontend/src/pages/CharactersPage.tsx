import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CharacterForm } from "@/features/characters/CharacterForm";
import { createCharacter, deleteCharacter, getCharacters, updateCharacter } from "@/features/characters/api";
import { getBooks } from "@/features/books/api";
import type { Book, Character, CharacterPayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export function CharactersPage() {
  const params = useParams();
  const routeBookId = params.bookId ? Number(params.bookId) : null;
  const lockedBookId = Number.isFinite(routeBookId) ? routeBookId : null;
  const [books, setBooks] = useState<Book[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(lockedBookId);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [focusedCharacter, setFocusedCharacter] = useState<Character | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const roleTypeLabelMap: Record<string, string> = {
    protagonist: "主角",
    supporting: "重要配角",
    antagonist: "反派",
    mentor: "导师/引路人",
    other: "其他"
  };

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
      setCharacters([]);
      return;
    }

    async function loadCharacters() {
      setLoadingCharacters(true);
      setErrorMessage("");

      try {
        const data = await getCharacters(selectedBookId);
        setCharacters(data);
        setFocusedCharacter((current) => {
          if (!current) {
            return data[0] ?? null;
          }

          const next = data.find((item) => item.id === current.id);
          return next ?? data[0] ?? null;
        });
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载角色失败");
      }
      finally {
        setLoadingCharacters(false);
      }
    }

    void loadCharacters();
  }, [selectedBookId]);

  async function handleSubmit(payload: CharacterPayload) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingCharacter) {
        const updated = await updateCharacter(editingCharacter.id, payload);
        setCharacters((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setEditingCharacter(null);
        setFocusedCharacter(updated);
        setSelectedBookId(updated.bookId);
      }
      else {
        const created = await createCharacter(payload);
        setSelectedBookId(created.bookId);
        setCharacters((current) => (
          created.bookId === selectedBookId ? [created, ...current] : current
        ));
        setFocusedCharacter(created);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交角色失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setErrorMessage("");

    try {
      await deleteCharacter(id);
      setCharacters((current) => current.filter((item) => item.id !== id));

      if (editingCharacter?.id === id) {
        setEditingCharacter(null);
      }
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除角色失败");
    }
  }

  const summaryText = useMemo(() => {
    if (loadingBooks) {
      return "正在加载作品与角色数据...";
    }

    return `当前作品下已有 ${characters.length} 个角色，已接通真实接口与数据库。`;
  }, [characters.length, loadingBooks]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="角色管理"
        description="负责角色列表、多维人设、成长弧线和关系网的基础承载结构。"
        actionLabel="角色 CRUD 已接通"
        status="implemented"
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="角色创建与列表" description={summaryText}>
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-5">
            <CharacterForm
              books={books}
              editingCharacter={editingCharacter}
              isSubmitting={isSubmitting}
              lockedBookId={lockedBookId}
              onSubmit={handleSubmit}
              onCancelEdit={() => setEditingCharacter(null)}
            />

            {!lockedBookId ? (
              <label className="grid gap-2 text-sm text-mist/70">
                当前查看作品
                <select
                  value={selectedBookId ?? ""}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setSelectedBookId(Number.isNaN(value) ? null : value);
                    setEditingCharacter(null);
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

            {loadingCharacters ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-mist/65">正在加载角色列表...</div>
            ) : (
              <div className="space-y-4">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className={[
                      "rounded-3xl border bg-white/[0.03] p-5 transition",
                      focusedCharacter?.id === character.id ? "border-accent/40" : "border-white/10 hover:border-white/20"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setFocusedCharacter(character)}
                        className="min-w-0 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-medium text-white">{character.name}</h3>
                          <span className="text-xs text-mist/45">{character.bookName}</span>
                        </div>
                        <p className="mt-2 text-sm text-mist/65">{character.summary || "暂无角色摘要"}</p>
                      </button>
                      <StatusBadge>{roleTypeLabelMap[character.roleType] ?? character.roleType}</StatusBadge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {character.tags.length > 0 ? character.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
                          {tag}
                        </span>
                      )) : (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist/60">
                          暂无画像标签
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-mist/45">身份与阵营</p>
                        <p className="mt-2 text-sm text-white">
                          {[character.profile.occupation, character.profile.faction].filter(Boolean).join(" / ") || "未设置"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-mist/45">动机与目标</p>
                        <p className="mt-2 text-sm text-white">
                          {[character.profile.motivation, character.profile.goal].filter(Boolean).join(" / ") || "未设置"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-mist/45">更新时间</p>
                        <p className="mt-2 text-sm text-white">{character.updatedAt ? new Date(character.updatedAt).toLocaleString() : "暂无"}</p>
                      </div>
                      <div className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-mist/45">创建时间</p>
                        <p className="mt-2 text-sm text-white">{character.createdAt ? new Date(character.createdAt).toLocaleString() : "暂无"}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCharacter(character);
                          setFocusedCharacter(character);
                        }}
                        className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(character.id)}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08]"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}

                {!loadingCharacters && characters.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
                    当前作品还没有角色，先在上方创建一个角色。
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="角色画像面板" description="点击左侧某个角色，可以在这里集中查看多维画像要点。">
          {focusedCharacter ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-accent/70">当前查看</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{focusedCharacter.name}</h3>
                    <p className="mt-2 text-sm text-mist/65">{roleTypeLabelMap[focusedCharacter.roleType] ?? focusedCharacter.roleType}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCharacter(focusedCharacter)}
                    className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                  >
                    进入编辑
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-white">基础信息</p>
                  <p className="mt-3 text-sm text-mist/70">
                    {[focusedCharacter.profile.gender, focusedCharacter.profile.age, focusedCharacter.profile.occupation].filter(Boolean).join(" / ") || "未设置"}
                  </p>
                  <p className="mt-2 text-sm text-mist/70">阵营：{focusedCharacter.profile.faction || "未设置"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-white">外貌与性格</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.appearance || "未设置"}</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.personality || "未设置"}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-white">动机、目标与恐惧</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.motivation || "动机未设置"}</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.goal || "目标未设置"}</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.fear || "恐惧未设置"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm font-medium text-white">强弱点、秘密与弧线</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.strength || "强项未设置"}</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.weakness || "弱点未设置"}</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.secret || "秘密未设置"}</p>
                  <p className="mt-3 text-sm text-mist/70 whitespace-pre-wrap">{focusedCharacter.profile.arc || "弧线未设置"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 p-6 text-sm text-mist/65">
              还没有选中角色，先在左侧点一个角色卡片。
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
