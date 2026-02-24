export interface ModelEntry {
  id: string;
  label: string;
  provider: "anthropic" | "codex";
  /** Context window size in tokens */
  contextWindow: number;
  /** Cost per million input tokens (USD). 0 = free (OAuth/subscription). */
  inputCostPer1M: number;
  /** Cost per million output tokens (USD). 0 = free (OAuth/subscription). */
  outputCostPer1M: number;
}

export const ALL_MODELS: ModelEntry[] = [
  { id: "claude-opus-4-6",     label: "Opus 4.6",       provider: "anthropic", contextWindow: 200_000, inputCostPer1M: 15,   outputCostPer1M: 75   },
  { id: "claude-sonnet-4-5",   label: "Sonnet 4.5",     provider: "anthropic", contextWindow: 200_000, inputCostPer1M: 3,    outputCostPer1M: 15   },
  { id: "claude-haiku-4-5",    label: "Haiku 4.5",      provider: "anthropic", contextWindow: 200_000, inputCostPer1M: 0.80, outputCostPer1M: 4    },
  { id: "gpt-5.3-codex",       label: "Codex 5.3",      provider: "codex",     contextWindow: 400_000, inputCostPer1M: 0,    outputCostPer1M: 0    },
  { id: "gpt-5.2-codex",       label: "Codex 5.2",      provider: "codex",     contextWindow: 400_000, inputCostPer1M: 0,    outputCostPer1M: 0    },
  { id: "gpt-5.1-codex-max",   label: "Codex 5.1 Max",  provider: "codex",     contextWindow: 400_000, inputCostPer1M: 0,    outputCostPer1M: 0    },
  { id: "gpt-5.1-codex-mini",  label: "Codex 5.1 Mini", provider: "codex",     contextWindow: 400_000, inputCostPer1M: 0,    outputCostPer1M: 0    },
  { id: "gpt-5.1-codex",       label: "Codex 5.1",      provider: "codex",     contextWindow: 400_000, inputCostPer1M: 0,    outputCostPer1M: 0    },
];

/** Look up a model entry by id */
export function modelEntryById(id: string): ModelEntry | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}

/** Estimate cost in USD given token counts and model id */
export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = modelEntryById(modelId);
  if (!model) return 0;
  return (inputTokens / 1_000_000) * model.inputCostPer1M + (outputTokens / 1_000_000) * model.outputCostPer1M;
}

export const DEFAULT_ANTHROPIC_MODEL = ALL_MODELS[0].id;
export const DEFAULT_CODEX_MODEL = ALL_MODELS[3].id;

export function labelForModelId(id: string): string {
  return ALL_MODELS.find((m) => m.id === id)?.label ?? id;
}

export function providerForModelId(id: string): "anthropic" | "codex" | null {
  return ALL_MODELS.find((m) => m.id === id)?.provider ?? null;
}

/**
 * Return the cheapest / smallest model available given authorized providers.
 * Order of preference: haiku → codex-mini → sonnet → codex-5.2 → codex-5.3 → opus
 */
const TITLE_MODEL_PRIORITY: string[] = [
  "claude-haiku-4-5",
  "gpt-5.1-codex-mini",
  "gpt-5.1-codex",
  "claude-sonnet-4-5",
  "gpt-5.2-codex",
  "gpt-5.1-codex-max",
  "gpt-5.3-codex",
  "claude-opus-4-6",
];

export function smallestAvailableModelId(authorizedProviderIds: Set<string>): string | null {
  for (const modelId of TITLE_MODEL_PRIORITY) {
    const entry = ALL_MODELS.find((m) => m.id === modelId);
    if (entry && authorizedProviderIds.has(entry.provider)) return modelId;
  }
  return null;
}

/** URLs for the API Key auth mode — direct key management consoles */
export const API_KEY_URLS: Record<string, string> = {
  anthropic: "https://console.anthropic.com/settings/keys",
  codex: "https://platform.openai.com/api-keys",
};


