import { PluginSettingTab, App, Setting, DropdownComponent, TFolder } from "obsidian";
import { ObsidianAgentPlugin, getApp, getPlugin } from "src/plugin";
import { ChooseModelModal } from "src/components/modal/ChooseModelModal";

// Interface for the settings of the plugin
export interface AgentSettings {
  provider: string;
  model: string;
  googleApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  mistralApiKey: string;
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

    containerEl.createEl('h1', { text: 'Language Model' });

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

    containerEl.createEl('h1', { text: 'API keys' });

    // GOOGLE
    const googleSetting = new Setting(containerEl)
      .setName("Google key")
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
        .setTooltip("Show/Hide API Key")
        .onClick(() => {
          googleRevealed = !googleRevealed;
          const input = googleSetting.controlEl.querySelector("input");
          if (input) input.type = googleRevealed ? "text" : "password";
          btn.setIcon(googleRevealed ? "eye-off" : "eye");
        });
    });


    // OPENAI
    const openaiSetting = new Setting(containerEl)
      .setName("OpenAI key")
      .setDesc("Enter your OpenAI API key. Not required if you are not using OpenAI models.");
    let openaiRevealed = false;
    openaiSetting.addText((text) => {
      text
        .setPlaceholder("Enter your API key")
        .setValue(this.plugin.settings.openaiApiKey)
        .onChange(async (value) => {
          this.plugin.settings.openaiApiKey = value;
          await this.plugin.saveSettings();
        });
      text.inputEl.type = "password";
    });
    openaiSetting.addExtraButton((btn) => {
      btn.setIcon("eye")
        .setTooltip("Show/Hide API Key")
        .onClick(() => {
          openaiRevealed = !openaiRevealed;
          const input = openaiSetting.controlEl.querySelector("input");
          if (input) input.type = openaiRevealed ? "text" : "password";
          btn.setIcon(openaiRevealed ? "eye-off" : "eye");
        });
    });

    // ANTHROPIC
    const anthropicSetting = new Setting(containerEl)
      .setName("Anthropic key")
      .setDesc("Enter your Anthropic API key. Not required if you are not using Anthropic models.");
    let anthropicRevealed = false;
    anthropicSetting.addText((text) => {
      text
        .setPlaceholder("Enter your API key")
        .setValue(this.plugin.settings.anthropicApiKey)
        .onChange(async (value) => {
          this.plugin.settings.anthropicApiKey = value;
          await this.plugin.saveSettings();
        });
      text.inputEl.type = "password";
    });
    anthropicSetting.addExtraButton((btn) => {
      btn.setIcon("eye")
        .setTooltip("Show/Hide API Key")
        .onClick(() => {
          anthropicRevealed = !anthropicRevealed;
          const input = anthropicSetting.controlEl.querySelector("input");
          if (input) input.type = anthropicRevealed ? "text" : "password";
          btn.setIcon(anthropicRevealed ? "eye-off" : "eye");
        });
    });

    // MISTRAL
    const mistralSetting = new Setting(containerEl)
      .setName("Mistral key")
      .setDesc("Enter your Mistral API key. Not required if you are not using Mistral models.");
    let mistralRevealed = false;
    mistralSetting.addText((text) => {
      text
        .setPlaceholder("Enter your API key")
        .setValue(this.plugin.settings.mistralApiKey)
        .onChange(async (value) => {
          this.plugin.settings.mistralApiKey = value;
          await this.plugin.saveSettings();
        });
      text.inputEl.type = "password";
    });
    mistralSetting.addExtraButton((btn) => {
      btn.setIcon("eye")
        .setTooltip("Show/Hide API Key")
        .onClick(() => {
          mistralRevealed = !mistralRevealed;
          const input = mistralSetting.controlEl.querySelector("input");
          if (input) input.type = mistralRevealed ? "text" : "password";
          btn.setIcon(mistralRevealed ? "eye-off" : "eye");
        });
    });

    containerEl.createEl('h1', { text: 'Agent settings' });

    // Agent rules (big textarea)
    const rulesSetting = new Setting(containerEl)
      .setName("Agent rules")
      .setDesc("Add rules to change the agent behaviour and responses. For example: 'Always answer in English'");
    rulesSetting.settingEl.style.flexDirection = "column";
    rulesSetting.settingEl.style.alignItems = "stretch";
    rulesSetting.controlEl.style.width = "100%";
    rulesSetting.addTextArea((text) => {
      text
        .setValue(this.plugin.settings.rules)
        .onChange(async (value) => {
          this.plugin.settings.rules = value;
          await this.plugin.saveSettings();
        });
      text.inputEl.rows = 6;
      text.inputEl.style.width = "100%";
      text.inputEl.style.minHeight = "120px";
      text.inputEl.style.fontSize = "1em";
      text.inputEl.style.resize = "vertical";
      text.inputEl.style.marginTop = "0.5em";
    });
      
    containerEl.createEl('h1', { text: 'Chat history folder' });

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

    containerEl.createEl('h1', { text: 'Developer settings' });

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