import { PluginSettingTab, App, Setting, DropdownComponent, TFolder } from "obsidian";
import { ObsidianAgentPlugin, getApp, getPlugin } from "src/plugin";
import { ChooseModelModal } from "src/feature/modals/ChooseModelModal";

// Interface for the settings of the plugin
export interface AgentSettings {
  provider: string;
  model: string;
  googleApiKey: string;
  rules: string;
  chatsFolder: string;
  debug: boolean;
}

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

    // Language model settings
    new Setting(containerEl)
      .setName("Model")
      .setDesc("Select the language model to use.")
      .addButton((button) => {
        button.setButtonText(this.plugin.settings.model || "Choose model");
        button.onClick(() => {
          const app = getApp();
          const plugin = getPlugin();
          new ChooseModelModal(app, (model) => {
            this.plugin.settings.model = model.name;
            this.plugin.settings.provider = model.provider;
            plugin.saveSettings();
            button.setButtonText(model.name);
          }).open();
        });
        return button;
      });

    // Chat history folder
    new Setting(containerEl)
      .setName("Chat history folder")
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
    
    // Agent rules
    const rulesSetting = new Setting(containerEl)
      .setName("Agent rules")
      .setDesc("Add rules to change the agent behaviour and responses. For example: 'Always answer in English'");
    
    rulesSetting.settingEl.classList.add("obsidian-agent__settings-rules-container");
    rulesSetting.controlEl.classList.add("obsidian-agent__settings-rules-control");
    
    rulesSetting.addTextArea((text) => {
      text
        .setValue(this.plugin.settings.rules)
        .onChange(async (value) => {
          this.plugin.settings.rules = value;
          await this.plugin.saveSettings();
        });
      text.inputEl.rows = 6;
      text.inputEl.classList.add("obsidian-agent__settings-rules-textarea");
    });


    // API keys settings
    // GOOGLE
    const googleSetting = new Setting(containerEl)
      .setName("Google api key")
      .setDesc("Enter your Google API key. Not required if you are not using Google models.");
    let googleRevealed = false;
    googleSetting.addText((text) => {
      text
        .setPlaceholder("Enter your API key.")
        .setValue(this.plugin.settings.googleApiKey)
        .onChange(async (value) => {
          this.plugin.settings.googleApiKey = value;
          await this.plugin.saveSettings();
        });
      text.inputEl.type = "password";
    });
    googleSetting.addExtraButton((btn) => {
      btn.setIcon("eye")
        .setTooltip("Show/hide api key")
        .onClick(() => {
          googleRevealed = !googleRevealed;
          const input = googleSetting.controlEl.querySelector("input");
          if (input) input.type = googleRevealed ? "text" : "password";
          btn.setIcon(googleRevealed ? "eye-off" : "eye");
        });
    });

    
    // Developer settings
    new Setting(containerEl).setName('Developer settings').setHeading();

    new Setting(containerEl)
      .setName("Debug mode")
      .setDesc("Enable debug mode to see detailed logs and information about the plugin's operation.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debug)
          .onChange(async (value) => {
            this.plugin.settings.debug = value;
            await this.plugin.saveSettings();
          })
      );
    
  }
}