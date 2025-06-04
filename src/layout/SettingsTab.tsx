import { PluginSettingTab, App, Setting, DropdownComponent, TFolder } from "obsidian";
import { ObsidianAgentPlugin } from "../plugin";

// Interface for the settings of the plugin
export interface AgentSettings {
  language: string;
  provider: string;
  model: string;
  googleApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  rules: string;
  chatsFolder: string;
}

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
};

// Available models and their providers
export const allModels = [
  { provider: "google", model: "gemini-1.5-flash" },
  { provider: "google", model: "gemini-1.5-pro" },
  { provider: "google", model: "gemini-2.0-flash" },
  { provider: "openai", model: "gpt-4.1" },
  { provider: "openai", model: "gpt-4o" },
  { provider: "openai", model: "gpt-4o-mini" },
  { provider: "anthropic", model: "claude-3-5-sonnet" },
  { provider: "anthropic", model: "claude-4-sonnet" }
];

// Settings tab class
export class AgentSettingsTab extends PluginSettingTab {
  plugin: ObsidianAgentPlugin;

  constructor(app: App, plugin: ObsidianAgentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // Method that displays the settings tab
  display(): void {
    let { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h1', { text: 'Language Model Settings' });

    new Setting(containerEl)
      .setName("Model")
      .setDesc("Select the language model to use.")
      .addDropdown((dropdown: DropdownComponent) => {

        // Add all models to dropdown
        allModels.forEach(({ model }) => {
          dropdown.addOption(model, model);
        });

        // Set current model
        dropdown
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            // Find the provider for the selected model
            const selectedModel = allModels.find(m => m.model === value);
            if (selectedModel) {
              this.plugin.settings.model = value;
              this.plugin.settings.provider = selectedModel.provider;
              await this.plugin.saveSettings();
            }
          });

        return dropdown;
      });

    containerEl.createEl('h1', { text: 'API Keys Settings' });

    new Setting(containerEl)
      .setName("Google API Key")
      .setDesc("Enter your Google API key. Not required if you are not using Google as provider.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key.")
  .setValue(this.plugin.settings.googleApiKey)
          .onChange(async (value) => {
            this.plugin.settings.googleApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Enter your OpenAI API key. Not required if you are not using OpenAI as provider.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
  .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Anthropic API Key")
      .setDesc("Enter your Anthropic API key. Not required if you are not using Anthropic as provider.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
  .setValue(this.plugin.settings.anthropicApiKey)
          .onChange(async (value) => {
            this.plugin.settings.anthropicApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl('h1', { text: 'Agent Settings' });
      
    new Setting(containerEl)
      .setName('Agent language')
      .setDesc('Select the language for the agent system prompts.')
      .addDropdown((dropdown: DropdownComponent) =>
        dropdown
          .addOption('en', 'English')
          .addOption('es', 'Spanish')
  .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Agent rules")
      .setDesc("Add rules to change the agent behaviour and responses. For example: 'Always answer in English'")
      .addText((text) =>
        text
  .setValue(this.plugin.settings.rules)
          .onChange(async (value) => {
            this.plugin.settings.rules = value;
            await this.plugin.saveSettings();
          })
      );
      
    containerEl.createEl('h1', { text: 'Chat History Settings' });

    new Setting(containerEl)
      .setName("Chat folder")
      .setDesc("Select the folder where the chat history will be saved.")
      .addDropdown((dropdown: DropdownComponent) => {
        const folders = this.app.vault.getAllLoadedFiles().filter(file => file instanceof TFolder);
        folders.forEach(folder => {
          dropdown.addOption(folder.path, folder.name);
        });
        
        dropdown
          .setValue(this.plugin.settings.chatsFolder)
          .onChange(async (value) => {
            this.plugin.settings.chatsFolder = value;
            await this.plugin.saveSettings();
          });
      });
  }
}