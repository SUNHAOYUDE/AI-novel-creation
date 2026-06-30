import { useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "@/features/audit-logs/api";
import { getBackstories } from "@/features/backstories/api";
import { getBooks } from "@/features/books/api";
import { getChapters } from "@/features/chapters/api";
import { getCharacters } from "@/features/characters/api";
import { getEconomyEntries } from "@/features/economy/api";
import { getForeshadows } from "@/features/foreshadows/api";
import { getOutlines } from "@/features/outlines/api";
import { getSystemSettings, updateSystemSettings } from "@/features/system-settings/api";
import { getTimelineEvents } from "@/features/timelines/api";
import { getWorldMaps } from "@/features/world-maps/api";
import type { AuditLog, Book, SystemSettings, UpdateSystemSettingsPayload } from "@/shared/types";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionCard } from "@/shared/ui/SectionCard";

const defaultSettings: SystemSettings = {
  deepSeek: {
    configured: false,
    apiKeyMasked: "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat"
  },
  ai: {
    requestTimeoutMs: 30000
  }
};

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [settingsDraft, setSettingsDraft] = useState<UpdateSystemSettingsPayload>({});
  const [isSaving, setIsSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditEntityType, setAuditEntityType] = useState<string>("");
  const [auditLimit, setAuditLimit] = useState(50);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function bootstrap() {
      setLoadingSettings(true);
      setErrorMessage("");

      try {
        const data = await getSystemSettings();
        setSettings(data);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载系统设置失败");
      }
      finally {
        setLoadingSettings(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    async function loadBooks() {
      setLoadingBooks(true);
      setErrorMessage("");

      try {
        const data = await getBooks();
        setBooks(data);
        setSelectedBookId(data[0]?.id ?? null);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "加载作品列表失败");
      }
      finally {
        setLoadingBooks(false);
      }
    }

    void loadBooks();
  }, []);

  const deepSeekSummary = useMemo(() => {
    if (loadingSettings) {
      return "正在读取当前模型配置...";
    }

    if (settings.deepSeek.configured) {
      return `已配置（${settings.deepSeek.model} / ${settings.deepSeek.baseUrl} / ${settings.deepSeek.apiKeyMasked}）`;
    }

    return "未配置（AI 生成相关功能会被禁止）";
  }, [loadingSettings, settings.deepSeek]);

  function downloadText(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveSettings() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const updated = await updateSystemSettings(settingsDraft);
      setSettings(updated);
      setSettingsDraft({});
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存系统设置失败");
    }
    finally {
      setIsSaving(false);
    }
  }

  async function exportBookJson() {
    if (!selectedBookId) {
      return;
    }

    setIsExporting(true);
    setErrorMessage("");

    try {
      const [
        backstories,
        maps,
        timeline,
        economy,
        characters,
        outlines,
        foreshadows,
        chapters,
        audit
      ] = await Promise.all([
        getBackstories(selectedBookId),
        getWorldMaps(selectedBookId),
        getTimelineEvents(selectedBookId),
        getEconomyEntries(selectedBookId),
        getCharacters(selectedBookId),
        getOutlines(selectedBookId),
        getForeshadows(selectedBookId),
        getChapters(selectedBookId),
        getAuditLogs({ bookId: selectedBookId, limit: 200 })
      ]);

      const book = books.find((item) => item.id === selectedBookId) ?? null;
      const payload = {
        exportedAt: new Date().toISOString(),
        book,
        modules: {
          backstories,
          maps,
          timeline,
          economy,
          characters,
          outlines,
          foreshadows,
          chapters,
          auditLogs: audit
        }
      };

      downloadText(`book-${selectedBookId}-export.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "导出失败");
    }
    finally {
      setIsExporting(false);
    }
  }

  async function exportWorldbookMarkdown() {
    if (!selectedBookId) {
      return;
    }

    setIsExporting(true);
    setErrorMessage("");

    try {
      const [backstories, economy, maps, timeline] = await Promise.all([
        getBackstories(selectedBookId),
        getEconomyEntries(selectedBookId),
        getWorldMaps(selectedBookId),
        getTimelineEvents(selectedBookId)
      ]);

      const book = books.find((item) => item.id === selectedBookId) ?? null;
      const title = book?.name ?? `book-${selectedBookId}`;

      const backstorySection = [
        "## 世界设定",
        "",
        ...backstories
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => [
            `### [${item.kind}] ${item.sortOrder}. ${item.title}`,
            "",
            item.content || "暂无内容",
            ""
          ].join("\n"))
      ].join("\n");

      const economySection = [
        "## 经济系统",
        "",
        ...economy
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => [
            `### [${item.category}] ${item.sortOrder}. ${item.title}`,
            "",
            item.description || "暂无内容",
            "",
            item.coreValue ? `- 核心价值物：${item.coreValue}` : "- 核心价值物：未设置",
            item.circulation ? `- 流通机制：${item.circulation}` : "- 流通机制：未设置",
            item.risk ? `- 风险点：${item.risk}` : "- 风险点：未设置",
            ""
          ].join("\n"))
      ].join("\n");

      const mapsSection = [
        "## 地图目录",
        "",
        ...maps
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => `- [${item.mapType}] ${item.sortOrder}. ${item.title}`)
      ].join("\n");

      const timelineSection = [
        "## 时间线目录",
        "",
        ...timeline
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => `- ${item.sortOrder}. ${item.timeLabel} ${item.title}`)
      ].join("\n");

      const content = [
        `# ${title}·设定集`,
        "",
        `导出时间：${new Date().toLocaleString()}`,
        "",
        backstorySection,
        "",
        economySection,
        "",
        mapsSection,
        "",
        timelineSection,
        ""
      ].join("\n");

      downloadText(`book-${selectedBookId}-worldbook.md`, content, "text/markdown;charset=utf-8");
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "导出失败");
    }
    finally {
      setIsExporting(false);
    }
  }

  async function refreshAudit() {
    setLoadingAudit(true);
    setErrorMessage("");

    try {
      const data = await getAuditLogs({
        bookId: selectedBookId ?? undefined,
        entityType: auditEntityType.trim() ? auditEntityType.trim() : undefined,
        limit: auditLimit
      });
      setAuditLogs(data);
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "加载审计日志失败");
      setAuditLogs([]);
    }
    finally {
      setLoadingAudit(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        description="在这里集中管理模型配置、导出中心与审计中心。所有 AI/存储/扩展能力优先从这里接入。"
        status="implemented"
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="模型配置" description={deepSeekSummary}>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-mist/70">
              DeepSeek Base URL
              <input
                value={settingsDraft.deepSeekBaseUrl ?? settings.deepSeek.baseUrl}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, deepSeekBaseUrl: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              />
            </label>
            <label className="grid gap-2 text-sm text-mist/70">
              DeepSeek 模型
              <input
                value={settingsDraft.deepSeekModel ?? settings.deepSeek.model}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, deepSeekModel: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              />
            </label>
            <label className="grid gap-2 text-sm text-mist/70">
              DeepSeek API Key（不会回显原值）
              <input
                value={settingsDraft.deepSeekApiKey ?? ""}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, deepSeekApiKey: event.target.value }))}
                type="password"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                placeholder={settings.deepSeek.apiKeyMasked ? `当前：${settings.deepSeek.apiKeyMasked}` : "未配置"}
              />
            </label>
            <label className="grid gap-2 text-sm text-mist/70">
              AI 请求超时
              <select
                value={settingsDraft.aiRequestTimeoutMs ?? settings.ai.requestTimeoutMs}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, aiRequestTimeoutMs: Number(event.target.value) }))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              >
                <option value={15000}>15 秒</option>
                <option value={30000}>30 秒（推荐）</option>
                <option value={45000}>45 秒</option>
                <option value={60000}>60 秒</option>
                <option value={90000}>90 秒</option>
                <option value={120000}>120 秒</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleSaveSettings()}
                disabled={isSaving}
                className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "保存中..." : "保存模型配置"}
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/70">
                {settings.deepSeek.configured ? "AI 功能可用" : "AI 功能不可用"}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="导出中心" description="把某本书的全部数据打包导出（包含审计日志）。">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-mist/70">
              选择作品
              <select
                value={selectedBookId ?? ""}
                onChange={(event) => setSelectedBookId(Number(event.target.value))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                disabled={loadingBooks || books.length === 0}
              >
                {books.length === 0 ? <option value="">暂无作品</option> : null}
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void exportBookJson()}
              disabled={!selectedBookId || isExporting}
              className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? "导出中..." : "导出这本书（JSON）"}
            </button>
            <button
              type="button"
              onClick={() => void exportWorldbookMarkdown()}
              disabled={!selectedBookId || isExporting}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? "导出中..." : "导出设定集（Markdown）"}
            </button>
            <p className="text-sm text-mist/65">
              导出内容包含：背景设定、地图、时间线、经济系统、角色、大纲、伏笔、章节与审计日志。
            </p>
          </div>
        </SectionCard>

        <SectionCard title="审计中心" description="集中查看所有模块的新增/更新/删除/AI 生成记录。">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-mist/70">
                过滤作品
                <select
                  value={selectedBookId ?? ""}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setSelectedBookId(Number.isNaN(value) ? null : value);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                  disabled={loadingBooks || books.length === 0}
                >
                  <option value="">全部作品</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-mist/70">
                过滤模块
                <select
                  value={auditEntityType}
                  onChange={(event) => setAuditEntityType(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                >
                  <option value="">全部模块</option>
                  <option value="book">作品</option>
                  <option value="backstory">背景设定</option>
                  <option value="world-map">地图</option>
                  <option value="timeline-event">时间线</option>
                  <option value="economy-entry">经济条目</option>
                  <option value="character">角色</option>
                  <option value="outline">大纲</option>
                  <option value="foreshadow">伏笔</option>
                  <option value="chapter">章节</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm text-mist/70">
              拉取数量
              <select
                value={auditLimit}
                onChange={(event) => setAuditLimit(Number(event.target.value))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              >
                <option value={50}>50 条</option>
                <option value={100}>100 条</option>
                <option value={200}>200 条</option>
              </select>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void refreshAudit()}
                disabled={loadingAudit}
                className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAudit ? "加载中..." : "刷新审计"}
              </button>
              <button
                type="button"
                onClick={() => downloadText("audit-logs.json", JSON.stringify(auditLogs, null, 2), "application/json;charset=utf-8")}
                disabled={auditLogs.length === 0}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-mist/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                导出审计（JSON）
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              {auditLogs.length === 0 ? (
                <div className="text-sm text-mist/65">
                  暂无审计记录。第一次启用需要重启后端；之后对各模块的新增/编辑/删除会自动写入。
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-white">{log.summary}</p>
                        <p className="text-xs text-mist/50">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="mt-2 text-xs text-mist/60">{log.entityType} / {log.action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="系统信息" description="便于排查运行环境与版本问题。">
          <div className="grid gap-3 text-sm text-mist/70">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              前端地址：http://localhost:5173
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              后端地址：http://localhost:3000/api
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              DeepSeek：{deepSeekSummary}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
