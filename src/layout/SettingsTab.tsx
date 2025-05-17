import { PluginSettingTab, App, Setting, DropdownComponent } from "obsidian";
import { ObsidianAgentPlugin } from "../plugin";

// Interface for the settings of the plugin
export interface AgentSettings {
  model: string;
  apiKey: string;
}

// Default settings for the plugin
export const DEFAULT_SETTINGS: Partial<AgentSettings> = {
  model: 'gemini-2.0-flash',
  apiKey: '',
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
  }
}
