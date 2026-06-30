import { Injectable } from "@nestjs/common";
import { SystemSettingsRepository } from "../modules/system-settings/system-settings.repository.js";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekChatResponse = {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
  }>;
};

@Injectable()
export class DeepSeekProvider {
  private cachedConfig:
    | {
      apiKey: string;
      baseUrl: string;
      model: string;
    }
    | null = null;
  private cachedAt = 0;

  constructor(private readonly systemSettingsRepository: SystemSettingsRepository) {}

  async isConfigured() {
    const config = await this.getConfig();
    return config.apiKey.trim().length > 0;
  }

  async getConfigSummary() {
    const config = await this.getConfig();
    return {
      configured: config.apiKey.trim().length > 0,
      baseUrl: config.baseUrl,
      model: config.model
    };
  }

  async createChatCompletion(messages: ChatMessage[]) {
    const config = await this.getConfig();

    if (!config.apiKey.trim()) {
      throw new Error("DeepSeek API key is not configured.");
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek request failed: ${response.status} ${errorText}`);
    }

    return (await response.json()) as DeepSeekChatResponse;
  }

  private async getConfig() {
    const now = Date.now();
    if (this.cachedConfig && now - this.cachedAt < 10000) {
      return this.cachedConfig;
    }

    const apiKey = process.env.DEEPSEEK_API_KEY ?? (await this.systemSettingsRepository.get("deepseek.apiKey")) ?? "";
    const baseUrl = process.env.DEEPSEEK_BASE_URL ?? (await this.systemSettingsRepository.get("deepseek.baseUrl")) ?? "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL ?? (await this.systemSettingsRepository.get("deepseek.model")) ?? "deepseek-chat";

    const config = { apiKey, baseUrl, model };
    this.cachedConfig = config;
    this.cachedAt = now;
    return config;
  }
}
