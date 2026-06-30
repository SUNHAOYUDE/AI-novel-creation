export type SystemSettingsDto = {
  deepSeek: {
    configured: boolean;
    apiKeyMasked: string;
    baseUrl: string;
    model: string;
  };
  ai: {
    requestTimeoutMs: number;
  };
};

export type UpdateSystemSettingsDto = {
  deepSeekApiKey?: string;
  deepSeekBaseUrl?: string;
  deepSeekModel?: string;
  aiRequestTimeoutMs?: number;
};
