import { ModelName, ModelProvider } from "./models";
import { AgentSettings } from "./SettingsTab";

// Default settings for the plugin
export const DEFAULT_SETTINGS: Partial<AgentSettings> = {
    provider: ModelProvider.DEFAULT,
    model: ModelName.DEFAULT,
    googleApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    rules: '',
    chatsFolder: 'Chats',
    amountOfMessagesInMemory: 3
  };