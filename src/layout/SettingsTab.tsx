import { PluginSettingTab, App, Setting, DropdownComponent } from "obsidian";
import { ObsidianAgentPlugin } from "../plugin";

// Interface for the settings of the plugin
export interface AgentSettings {
  language: string;
  model: string;
  apiKey: string;
  rules: string;
}

// Default settings for the plugin
export const DEFAULT_SETTINGS: Partial<AgentSettings> = {
  language: 'en',
  model: 'gemini-2.0-flash',
  apiKey: '',
  rules: 'Always answer in english',
};

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

    new Setting(containerEl)
      .setName('Agent language')
      .setDesc('Select the language for the agent system prompts, if changed restart the plugin to apply the changes.')
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
      .setName("Model name")
      .setDesc("Select the model to use, if changed restart the plugin to apply the changes.")
      .addDropdown((dropdown: DropdownComponent) =>
        dropdown
          .addOption("gemini-1.5-flash", "gemini-1.5-flash") 
          .addOption("gemini-1.5-pro", "gemini-1.5-pro")
          .addOption("gemini-2.0-flash", "gemini-2.0-flash")
  .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Enter your API key, if changed restart the plugin to apply the changes.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
  .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );

      new Setting(containerEl)
      .setName("Agent rules")
      .setDesc("Add rules to change the agent behaviour and responses, if changed restart the plugin to apply the changes.")
      .addText((text) =>
        text
  .setValue(this.plugin.settings.rules)
          .onChange(async (value) => {
            this.plugin.settings.rules = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
