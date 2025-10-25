import { AgentSettings } from "src/settings/SettingsTab";

// Default settings for the plugin
export const DEFAULT_SETTINGS: AgentSettings = {
  provider: "google",
  model: "gemini-2.0-flash",
  googleApiKey: '',
  rules: '',
  chatsFolder: 'Chats',
  debug: false,
  readImages: true,
};