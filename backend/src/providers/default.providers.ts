import { providerTokens } from "./provider.tokens.js";

export const defaultProviders = [
  {
    provide: providerTokens.llm,
    useValue: { name: "placeholder-llm-provider" }
  },
  {
    provide: providerTokens.storage,
    useValue: { name: "placeholder-storage-provider" }
  },
  {
    provide: providerTokens.commentSource,
    useValue: { name: "placeholder-comment-provider" }
  },
  {
    provide: providerTokens.workflow,
    useValue: { name: "placeholder-workflow-provider" }
  }
];
