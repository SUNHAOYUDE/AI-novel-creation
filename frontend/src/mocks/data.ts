import type { Book, Chapter, Character, Foreshadow, Outline, StatItem } from "@/shared/types";

export const stats: StatItem[] = [
  { label: "作品数", value: "03", hint: "当前接入 3 本演示作品" },
  { label: "角色数", value: "18", hint: "多维画像结构已预留" },
  { label: "章节数", value: "42", hint: "章节工作台壳子已铺好" },
  { label: "待回收伏笔", value: "11", hint: "后续可接伏笔管理和回收追踪" }
];

export const books: Book[] = [
  {
    id: 1,
    name: "烬海回声",
    category: "悬疑",
    subCategory: "群像",
    status: "草稿中",
    description: "一部围绕深海都市、集体记忆与身份错位展开的长篇故事。"
  },
  {
    id: 2,
    name: "秩序裂缝",
    category: "科幻",
    subCategory: "成长流",
    status: "策划中",
    description: "主打世界规则反噬与角色认知变化的长线连载项目。"
  }
];

export const outlines: Outline[] = [
  { id: 1, bookId: 1, level: "global", title: "总纲", summary: "围绕失踪案与城市记忆异常展开。", status: "已生成", sortOrder: 1 },
  { id: 2, bookId: 1, level: "volume", title: "第一卷", summary: "建立世界观并完成第一轮悬念投放。", status: "待细化", sortOrder: 2 },
  { id: 3, bookId: 1, level: "chapter", title: "第 1 章", summary: "通过一场失控追逐引入主角与主冲突。", status: "待检查", sortOrder: 3 }
];

export const characters: Character[] = [
  {
    id: 1,
    bookId: 1,
    bookName: "烬海回声",
    name: "林砚",
    roleType: "主角",
    summary: "理性强、控制欲强、隐藏创伤明显，适合承担推动剧情的主视角。",
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z",
    tags: ["理性 72", "野心 81", "控制欲 84"],
    profile: {
      gender: "男",
      age: "27",
      occupation: "前调查记者",
      faction: "无所属",
      appearance: "黑发，常穿深色风衣，眼神总像在审视细节。",
      personality: "理性、克制、戒备心强。",
      motivation: "查清失踪案真相和自己被篡改的记忆。",
      goal: "找到旧案核心证据。",
      fear: "再次失去关键记忆。",
      strength: "逻辑强、执行力高、观察敏锐。",
      weakness: "不信任他人，容易独断。",
      secret: "他曾主动参与过一次记忆封存。",
      arc: "从冷硬独行走向愿意信任同伴。"
    }
  },
  {
    id: 2,
    bookId: 1,
    bookName: "烬海回声",
    name: "周栖",
    roleType: "关键配角",
    summary: "外冷内热，长期压抑情绪，后续适合作为价值观冲突载体。",
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z",
    tags: ["共情 66", "信任阈值高", "反差感强"],
    profile: {
      gender: "女",
      age: "25",
      occupation: "港区档案员",
      faction: "港务档案局",
      appearance: "短发，衣着利落，习惯抱着文件夹。",
      personality: "冷静、克己、内心敏感。",
      motivation: "阻止旧案再次吞没无辜者。",
      goal: "保护档案馆里的关键证据。",
      fear: "真相被公开后牵连亲人。",
      strength: "记忆力强、共情高、耐心好。",
      weakness: "过度压抑自我，不愿求助。",
      secret: "她知道白塔事件的一部分真相。",
      arc: "从谨慎旁观转向主动站队。"
    }
  }
];

export const foreshadows: Foreshadow[] = [
  {
    id: 1,
    bookId: 1,
    bookName: "烬海回声",
    title: "断裂录音",
    surfaceInfo: "录音缺失第 17 秒，表面像设备故障。",
    realIntent: "为主角记忆被篡改的真相埋下第一层证据。",
    targetPayoff: "揭示主角记忆被篡改的事实。",
    status: "埋设中",
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  },
  {
    id: 2,
    bookId: 1,
    bookName: "烬海回声",
    title: "海面白塔",
    surfaceInfo: "只在风暴夜出现的远海建筑影像。",
    realIntent: "用于将世界观异象与主线身份谜团绑定。",
    targetPayoff: "对应第一卷末的身份揭晓。",
    status: "计划中",
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  }
];

export const chapters: Chapter[] = [
  {
    id: 1,
    bookId: 1,
    bookName: "烬海回声",
    chapterNo: 1,
    title: "风暴前的留声机",
    content: "暴雨来临前，港口边的留声机突然自行转动，像是在提醒某个被遗忘的人归来。",
    status: "草稿",
    wordCount: 2860,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  },
  {
    id: 2,
    bookId: 1,
    bookName: "烬海回声",
    chapterNo: 2,
    title: "不存在的目击者",
    content: "主角调查失踪案时，发现证词中的目击者根本不在城市档案内。",
    status: "检查中",
    wordCount: 3145,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  },
  {
    id: 3,
    bookId: 1,
    bookName: "烬海回声",
    chapterNo: 3,
    title: "白塔再现",
    content: "",
    status: "待写作",
    wordCount: 0,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  }
];
