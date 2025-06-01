import { PluginSettingTab, App, Setting, DropdownComponent } from "obsidian";
import { ObsidianAgentPlugin } from "../plugin";

// Interface for the settings of the plugin
export interface AgentSettings {
  language: string;
  provider: string;
  model: string;
  apiKey: string;
  rules: string;
}

// Default settings for the plugin
export const DEFAULT_SETTINGS: Partial<AgentSettings> = {
  language: 'en',
  provider: 'google',
  model: 'gemini-2.0-flash',
  apiKey: '',
  rules: 'Always answer in english',
};

// Model per provider
const modelsByProvider: Record<string, string[]> = {
  google: [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
  ],
  openai: [
    "gpt-4.1",
    "gpt-4o",
    "gpt-4o-mini",
  ],
  anthropic: [
    "claude-3-5-sonnet",
    "claude-4-sonnet",
  ],
};
let modelDropdown: DropdownComponent;

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
      .setName("Provider")
      .setDesc("Select the language model provider.")
      .addDropdown((dropdown: DropdownComponent) => {
        dropdown
          .addOption("google", "Google") 
          .addOption("openai", "OpenAI")
          .addOption("anthropic", "Anthropic")
  .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value;
            await this.plugin.saveSettings();

            // Update the model dropdown
            const models = modelsByProvider[value] || [];
            modelDropdown.selectEl.innerHTML = ""; // Clean options

            for (const model of models) {
              modelDropdown.addOption(model, model);
            }

            if (!models.includes(this.plugin.settings.model)) {
              this.plugin.settings.model = models[0];
              modelDropdown.setValue(models[0]);
              await this.plugin.saveSettings();
            }
          });
        return dropdown;
      });

    new Setting(containerEl)
      .setName("Model name")
      .setDesc("Select the language model to use.")
      .addDropdown((dropdown: DropdownComponent) => {
        modelDropdown = dropdown;
 
        const provider = this.plugin.settings.provider;
        const models = modelsByProvider[provider] || [];
      
        for (const model of models) {
          dropdown.addOption(model, model);
        }
      
        let currentModel = this.plugin.settings.model;
        if (!models.includes(currentModel)) {
          currentModel = models[0];
          this.plugin.settings.model = currentModel;
        }
      
        dropdown
          .setValue(currentModel)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          });
      
        return dropdown;
      });

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Enter your API key. REMEMBER to change the API key depending on the provider.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
  .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
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
  }
}
