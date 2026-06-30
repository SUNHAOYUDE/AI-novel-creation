import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Book, Character, CharacterPayload } from "@/shared/types";

const defaultState: CharacterPayload = {
  bookId: 0,
  name: "",
  roleType: "protagonist",
  summary: "",
  tags: [],
  profile: {
    gender: "",
    age: "",
    occupation: "",
    faction: "",
    appearance: "",
    personality: "",
    motivation: "",
    goal: "",
    fear: "",
    strength: "",
    weakness: "",
    secret: "",
    arc: ""
  }
};

type CharacterFormProps = {
  books: Book[];
  editingCharacter: Character | null;
  isSubmitting: boolean;
  lockedBookId?: number | null;
  onSubmit: (payload: CharacterPayload) => Promise<void>;
  onCancelEdit: () => void;
};

export function CharacterForm({
  books,
  editingCharacter,
  isSubmitting,
  lockedBookId,
  onSubmit,
  onCancelEdit
}: CharacterFormProps) {
  const initialState = useMemo<CharacterPayload>(() => ({
    ...defaultState,
    bookId: lockedBookId ?? books[0]?.id ?? 0
  }), [books, lockedBookId]);

  const [formState, setFormState] = useState<CharacterPayload>(initialState);
  const [tagsText, setTagsText] = useState("");

  useEffect(() => {
    if (!editingCharacter) {
      setFormState(initialState);
      setTagsText("");
      return;
    }

    setFormState({
      bookId: editingCharacter.bookId,
      name: editingCharacter.name,
      roleType: editingCharacter.roleType,
      summary: editingCharacter.summary,
      tags: editingCharacter.tags,
      profile: editingCharacter.profile
    });
    setTagsText(editingCharacter.tags.join(", "));
  }, [editingCharacter, initialState]);

  useEffect(() => {
    if (!lockedBookId) {
      return;
    }

    setFormState((current) => ({
      ...current,
      bookId: lockedBookId
    }));
  }, [lockedBookId]);

  function updateField<Key extends keyof CharacterPayload>(key: Key, value: CharacterPayload[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateProfileField<Key extends keyof CharacterPayload["profile"]>(key: Key, value: CharacterPayload["profile"][Key]) {
    setFormState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value
      }
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CharacterPayload = {
      ...formState,
      tags: tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };

    await onSubmit(payload);

    if (!editingCharacter) {
      setFormState(initialState);
      setTagsText("");
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
          角色名
          <input
            value={formState.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="输入角色名"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-mist/70">
          角色定位
          <select
            value={formState.roleType}
            onChange={(event) => updateField("roleType", event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          >
            <option value="protagonist">主角</option>
            <option value="supporting">重要配角</option>
            <option value="antagonist">反派</option>
            <option value="mentor">导师/引路人</option>
            <option value="other">其他</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-mist/70">
          标签画像
          <input
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="例如：理性 72, 控制欲强, 反差感"
          />
        </label>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">多维画像</p>
        <p className="mt-2 text-sm text-mist/65">把“外在 + 身份 + 欲望 + 恐惧 + 强弱点 + 秘密 + 成长弧线”写全，角色会更立体。</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-mist/70">
            性别
            <input
              value={formState.profile.gender}
              onChange={(event) => updateProfileField("gender", event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="例如：男 / 女 / 非二元 / 未公开"
            />
          </label>
          <label className="grid gap-2 text-sm text-mist/70">
            年龄/阶段
            <input
              value={formState.profile.age}
              onChange={(event) => updateProfileField("age", event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="例如：17 / 青年 / 中年 / 千年老怪"
            />
          </label>
          <label className="grid gap-2 text-sm text-mist/70">
            身份/职业
            <input
              value={formState.profile.occupation}
              onChange={(event) => updateProfileField("occupation", event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="例如：巡夜人 / 宗门弟子 / 商会掌柜"
            />
          </label>
          <label className="grid gap-2 text-sm text-mist/70">
            阵营/势力
            <input
              value={formState.profile.faction}
              onChange={(event) => updateProfileField("faction", event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="例如：昊天皇朝 / 黑潮商盟 / 无所属"
            />
          </label>
        </div>

        <label className="mt-4 grid gap-2 text-sm text-mist/70">
          外貌特征
          <textarea
            value={formState.profile.appearance}
            onChange={(event) => updateProfileField("appearance", event.target.value)}
            className="min-h-[100px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="写能被读者记住的特征：气质、穿着、标志物、习惯动作等。"
          />
        </label>

        <label className="mt-4 grid gap-2 text-sm text-mist/70">
          性格底色
          <textarea
            value={formState.profile.personality}
            onChange={(event) => updateProfileField("personality", event.target.value)}
            className="min-h-[100px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="例如：理性克制但极护短；表面温和，底层强控制欲。"
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-mist/70">
            动机/欲望
            <textarea
              value={formState.profile.motivation}
              onChange={(event) => updateProfileField("motivation", event.target.value)}
              className="min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="角色为什么行动？真正想要的是什么？"
            />
          </label>
          <label className="grid gap-2 text-sm text-mist/70">
            目标/短期任务
            <textarea
              value={formState.profile.goal}
              onChange={(event) => updateProfileField("goal", event.target.value)}
              className="min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="例如：三个月内夺回商路；进入内门；查清旧案。"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-mist/70">
            恐惧/底线
            <textarea
              value={formState.profile.fear}
              onChange={(event) => updateProfileField("fear", event.target.value)}
              className="min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="角色害怕失去什么？哪条底线一碰就爆？"
            />
          </label>
          <label className="grid gap-2 text-sm text-mist/70">
            秘密/隐瞒
            <textarea
              value={formState.profile.secret}
              onChange={(event) => updateProfileField("secret", event.target.value)}
              className="min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="最好能成为后续反转或伏笔的燃料。"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-mist/70">
            强项
            <textarea
              value={formState.profile.strength}
              onChange={(event) => updateProfileField("strength", event.target.value)}
              className="min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="能力、资源、人脉、性格优点都算。"
            />
          </label>
          <label className="grid gap-2 text-sm text-mist/70">
            弱点
            <textarea
              value={formState.profile.weakness}
              onChange={(event) => updateProfileField("weakness", event.target.value)}
              className="min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="会拖累他/她决策或行动的缺口与代价。"
            />
          </label>
        </div>

        <label className="mt-4 grid gap-2 text-sm text-mist/70">
          成长弧线
          <textarea
            value={formState.profile.arc}
            onChange={(event) => updateProfileField("arc", event.target.value)}
            className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
            placeholder="从什么状态出发，经历什么打击/选择，最终变成什么样。"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-mist/70">
        角色摘要
        <textarea
          value={formState.summary}
          onChange={(event) => updateField("summary", event.target.value)}
          className="min-h-[140px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
          placeholder="输入角色定位、冲突、成长潜力等摘要"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting || (!lockedBookId && books.length === 0)}
          className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : editingCharacter ? "保存角色" : "创建角色"}
        </button>

        {editingCharacter ? (
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
