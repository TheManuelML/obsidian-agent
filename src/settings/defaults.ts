import { ModelProvider } from "./models";
import { AgentSettings } from "./SettingsTab";

// Default settings for the plugin
export const DEFAULT_SETTINGS: Partial<AgentSettings> = {
    provider: ModelProvider.GOOGLE,
    model: 'gemini-2.0-flash',
    googleApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    rules: '',
    chatsFolder: 'Chats',
    amountOfMessagesInMemory: 3
  };