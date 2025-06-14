import { ModelName, ModelProvider } from "src/settings/models";
import { AgentSettings } from "src/settings/SettingsTab";

// Default settings for the plugin
export const DEFAULT_SETTINGS: Partial<AgentSettings> = {
    provider: ModelProvider.DEFAULT,
    model: ModelName.DEFAULT,
    googleApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    rules: '',
    chatsFolder: 'Chats',
    amountOfMessagesInMemory: 3,
    debug: false
  };