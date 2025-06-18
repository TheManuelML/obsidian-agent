import { SafetySetting } from "@google/generative-ai"; 

export interface Model {
  provider: ModelProvider,
  name: string,
  capabilities: ModelCapability[],
}

export enum ModelProvider {
  DEFAULT = 'google',
  OPENAI = 'openai',
  GOOGLE = 'google',
  ANTHROPIC = 'anthropic',
}

export enum ModelName {
  DEFAULT = "gemini-2.0-flash",
  GEMINI_20_FLASH = "gemini-2.0-flash",
  GEMINI_25_FLASH = "gemini-2.5-flash",
  GEMINI_25_PRO = "gemini-2.5-pro",
  GPT_41 = "gpt-4.1",
  GPT_4O = "gpt-4o",
  GPT_4O_MINI = "gpt-4o-mini",
  CLAUDE_35_SONNET = "claude-3-5-sonnet",
  CLAUDE_4_SONNET = "claude-4-sonnet",
}

export enum ModelCapability {
  REASONING = "reasoning",
  VISION = "vision",
  WEB_SEARCH = "websearch",
}

export interface ModelConfig {
  modelName: string;
  temperature?: number;
  streaming: boolean;
  maxRetries: number;
  apiKey?: string;
  safetySettings?: SafetySetting[]; // For google and vertexAI models
}

// Available models
export const allAvailableModels: Model[] = [
  { 
    provider: ModelProvider.GOOGLE, 
    name: ModelName.GEMINI_20_FLASH,
    capabilities: [ModelCapability.VISION],
  },
  {
    provider: ModelProvider.GOOGLE, 
    name: ModelName.GEMINI_25_FLASH,
    capabilities: [ModelCapability.VISION],
  },
  {
    provider: ModelProvider.GOOGLE, 
    name: ModelName.GEMINI_25_PRO,
    capabilities: [ModelCapability.VISION],
  },
  { 
    provider: ModelProvider.OPENAI, 
    name: ModelName.GPT_41,
    capabilities: [ModelCapability.VISION],
  },
  { 
    provider: ModelProvider.OPENAI, 
    name: ModelName.GPT_4O,
    capabilities: [ModelCapability.VISION],
  },
  { 
    provider: ModelProvider.OPENAI, 
    name: ModelName.GPT_4O_MINI,
    capabilities: [ModelCapability.VISION],
  },
  { 
    provider: ModelProvider.ANTHROPIC, 
    name: ModelName.CLAUDE_35_SONNET,
    capabilities: [],
  },
  {
    provider: ModelProvider.ANTHROPIC, 
    name: ModelName.CLAUDE_4_SONNET,
    capabilities: [],
  },
];