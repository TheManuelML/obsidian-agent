import { AgentSettings } from "./SettingsTab";

// Default settings for the plugin
export const DEFAULT_SETTINGS: Partial<AgentSettings> = {
    language: 'en',
    provider: 'google',
    model: 'gemini-2.0-flash',
    googleApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    rules: '',
    chatsFolder: 'Chats',
    amountOfMessagesInMemory: 3
  };