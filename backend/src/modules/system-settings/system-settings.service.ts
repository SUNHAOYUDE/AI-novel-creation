import { BadRequestException, Injectable } from "@nestjs/common";
import type { SystemSettingsDto, UpdateSystemSettingsDto } from "./dto/system-settings.dto.js";
import { SystemSettingsRepository } from "./system-settings.repository.js";

function maskApiKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}***`;
  }

  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}

@Injectable()
export class SystemSettingsService {
  constructor(private readonly systemSettingsRepository: SystemSettingsRepository) {}

  async getSettings(): Promise<SystemSettingsDto> {
    const apiKey = (await this.systemSettingsRepository.get("deepseek.apiKey")) ?? process.env.DEEPSEEK_API_KEY ?? "";
    const baseUrl = (await this.systemSettingsRepository.get("deepseek.baseUrl")) ?? process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
    const model = (await this.systemSettingsRepository.get("deepseek.model")) ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
    const requestTimeoutMs = (await this.systemSettingsRepository.getInt("ai.requestTimeoutMs"))
      ?? (process.env.AI_REQUEST_TIMEOUT_MS ? Number(process.env.AI_REQUEST_TIMEOUT_MS) : undefined)
      ?? 30000;

    return {
      deepSeek: {
        configured: apiKey.trim().length > 0,
        apiKeyMasked: maskApiKey(apiKey),
        baseUrl,
        model
      },
      ai: {
        requestTimeoutMs
      }
    };
  }

  async updateSettings(payload: UpdateSystemSettingsDto): Promise<SystemSettingsDto> {
    if (payload.deepSeekApiKey !== undefined) {
      const value = payload.deepSeekApiKey.trim();
      if (value.length === 0) {
        throw new BadRequestException("DeepSeek API Key 不能为空");
      }
      await this.systemSettingsRepository.set("deepseek.apiKey", value);
      process.env.DEEPSEEK_API_KEY = value;
    }

    if (payload.deepSeekBaseUrl !== undefined) {
      const value = payload.deepSeekBaseUrl.trim();
      if (value.length === 0) {
        throw new BadRequestException("DeepSeek Base URL 不能为空");
      }
      await this.systemSettingsRepository.set("deepseek.baseUrl", value);
      process.env.DEEPSEEK_BASE_URL = value;
    }

    if (payload.deepSeekModel !== undefined) {
      const value = payload.deepSeekModel.trim();
      if (value.length === 0) {
        throw new BadRequestException("DeepSeek 模型名不能为空");
      }
      await this.systemSettingsRepository.set("deepseek.model", value);
      process.env.DEEPSEEK_MODEL = value;
    }

    if (payload.aiRequestTimeoutMs !== undefined) {
      const timeout = Number(payload.aiRequestTimeoutMs);
      if (!Number.isFinite(timeout) || timeout < 5000 || timeout > 180000) {
        throw new BadRequestException("AI 超时时间需在 5000~180000ms 之间");
      }
      await this.systemSettingsRepository.setInt("ai.requestTimeoutMs", timeout);
      process.env.AI_REQUEST_TIMEOUT_MS = String(timeout);
    }

    return this.getSettings();
  }
}
