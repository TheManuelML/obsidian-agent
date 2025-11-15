import { SafetySetting } from "@google/generative-ai"; 

export interface Model {
  provider: "google",
  name: string,
  capabilities: Array<"vision" | "reasoning" | "websearch">,
  description: string,
}

export interface ModelConfig {
  modelName: string;
  streaming: boolean;
  apiKey?: string;
  safetySettings?: SafetySetting[];
}

export interface AiMessageInput {
  messages: Array<
    { 
      "role": "user", 
      "content": Array<
        {"type": "text", "text": string} |  
        {"type": "image_url", "image_url": {"url": string}}
      >; 
    }
  > 
}