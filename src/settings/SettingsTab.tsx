import { PluginSettingTab, App, Setting, DropdownComponent, TextComponent, TFolder } from "obsidian";
import { ObsidianAgentPlugin, getApp, getPlugin } from "src/plugin";
import { ChooseModelModal } from "src/feature/modals/ChooseModelModal";
import { Provider, SelectedModel } from "src/types/ai";

// Interface for the settings of the plugin
export interface AgentSettings {
  provider: Provider;
  model: string;
  modelSupportsImages: boolean;
  googleApiKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  openrouterApiKey: string;
  ollamaBaseUrl: string;
  baseUrl: string;
  temperature: string;
  thinkingLevel: string;
  maxOutputTokens: string;
  rules: string;
  chatsFolder: string;
  maxHistoryTurns: number;
  generateChatName: boolean;
  readImages: boolean;
  reviewChanges: boolean;
  debug: boolean;
}

// Default settings for the plugin
export const DEFAULT_SETTINGS: AgentSettings = {
  provider: "google",
  model: "gemini-2.5-flash",
  modelSupportsImages: true,
  googleApiKey: "",
  anthropicApiKey: "",
  openaiApiKey: "",
  openrouterApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  baseUrl: "",
  temperature: "Default",
  thinkingLevel: "Default",
  maxOutputTokens: "Default",
  rules: "",
  chatsFolder: "Chats",
  maxHistoryTurns: 2,
  generateChatName: true,
  readImages: true,
  reviewChanges: true,
  debug: false,
};

// Human-readable labels for each supported provider, used across the settings UI
const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google",
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  ollama: "Ollama (local)",
};

// Settings tab class
export class AgentSettingsTab extends PluginSettingTab {
  plugin: ObsidianAgentPlugin;

  constructor(app: App, plugin: ObsidianAgentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // Adds a password-style text field with a show/hide toggle button.
  // Shared by every provider credential field below to avoid repeating the
  // eye-icon wiring four times.
  private addSecretField(
    containerEl: HTMLElement,
    name: string,
    desc: string,
    placeholder: string,
    getValue: () => string,
    setValue: (value: string) => void
  ): void {
    const setting = new Setting(containerEl).setName(name).setDesc(desc);
    let revealed = false;
    let textComponent: TextComponent;
    setting.addText((text) => {
      textComponent = text;
      text
        .setPlaceholder(placeholder)
        .setValue(getValue())
        .onChange(async (value) => {
          setValue(value);
          await this.plugin.saveSettings();
        });
      text.inputEl.type = "password";
    });
    setting.addExtraButton((btn) => {
      btn.setIcon("eye")
        .setTooltip("Show/hide value")
        .onClick(() => {
          revealed = !revealed;
          textComponent.inputEl.type = revealed ? "text" : "password";
          btn.setIcon(revealed ? "eye-off" : "eye");
        });
    });
  }

  // Entry point called by Obsidian. Kept as a thin wrapper so internal
  // re-renders go through render() and avoid calling the deprecated display().
  display(): void {
    this.render();
  }

  // Method that renders the settings tab
  private render(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Provider selection
    new Setting(containerEl)
      .setName("Provider")
      .setDesc("Select the AI provider to use. Each provider needs its own credentials below.")
      .addDropdown((dropdown: DropdownComponent) => {
        (Object.keys(PROVIDER_LABELS) as Provider[]).forEach((provider) => {
          dropdown.addOption(provider, PROVIDER_LABELS[provider]);
        });

        dropdown
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value as Provider;
            await this.plugin.saveSettings();
            // Re-render so only the relevant credential field is shown
            this.render();
          });
      });

    // Model name (free text, since providers expose far more models than we could curate)
    new Setting(containerEl)
      .setName("Model")
      .setDesc("Type the exact model name your provider expects (e.g. gemini-2.5-flash, claude-sonnet-4-5, gpt-5, llama3.1).")
      .addText((text) => {
        text
          .setPlaceholder("Model name")
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          });
      })
      .addExtraButton((btn) => {
        btn.setIcon("list")
          .setTooltip("Browse suggested models")
          .onClick(() => {
            const app = getApp();
            const plugin = getPlugin();
            new ChooseModelModal(app, (selected: SelectedModel) => {
              this.plugin.settings.provider = selected.provider;
              this.plugin.settings.model = selected.name;
              void plugin.saveSettings();
              this.render();
            }).open();
          });
      });

    // Manual capability toggle: free-text model names can't be looked up for capabilities
    new Setting(containerEl)
      .setName("Model supports images")
      .setDesc("Enable this if the selected model can understand image input. This controls whether you can attach images to your messages.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.modelSupportsImages)
          .onChange(async (value) => {
            this.plugin.settings.modelSupportsImages = value;
            await this.plugin.saveSettings();
          })
      );

    // Per-provider credentials: only show the field relevant to the active provider
    new Setting(containerEl).setName("Credentials").setHeading();

    switch (this.plugin.settings.provider) {
      case "google":
        this.addSecretField(
          containerEl,
          "Google API key",
          "Enter your Google API key.",
          "Enter your API key.",
          () => this.plugin.settings.googleApiKey,
          (value) => (this.plugin.settings.googleApiKey = value)
        );
        break;
      case "anthropic":
        this.addSecretField(
          containerEl,
          "Anthropic API key",
          "Enter your Anthropic API key.",
          "Enter your API key.",
          () => this.plugin.settings.anthropicApiKey,
          (value) => (this.plugin.settings.anthropicApiKey = value)
        );
        break;
      case "openai":
        this.addSecretField(
          containerEl,
          "OpenAI API key",
          "Enter your OpenAI API key.",
          "Enter your API key.",
          () => this.plugin.settings.openaiApiKey,
          (value) => (this.plugin.settings.openaiApiKey = value)
        );
        break;
      case "openrouter":
        this.addSecretField(
          containerEl,
          "OpenRouter API key",
          "Enter your OpenRouter API key. Model names use OpenRouter's vendor/model format (e.g. anthropic/claude-sonnet-5.5).",
          "Enter your API key.",
          () => this.plugin.settings.openrouterApiKey,
          (value) => (this.plugin.settings.openrouterApiKey = value)
        );
        break;
      case "ollama":
        new Setting(containerEl)
          .setName("Ollama base URL")
          .setDesc("Enter the URL where your local Ollama server is running.")
          .addText((text) =>
            text
              .setPlaceholder(DEFAULT_SETTINGS.ollamaBaseUrl)
              .setValue(this.plugin.settings.ollamaBaseUrl)
              .onChange(async (value) => {
                this.plugin.settings.ollamaBaseUrl = value;
                await this.plugin.saveSettings();
              })
          );
        break;
    }

    // Base URL override (not applicable to Ollama, which has its own dedicated
    // field, or OpenRouter, which always uses its fixed endpoint)
    const provider = this.plugin.settings.provider;
    if (provider !== "ollama" && provider !== "openrouter") {
      new Setting(containerEl)
        .setName("Base URL override")
        .setDesc("Optionally override the default API endpoint for the selected provider. Leave blank to use the provider's default.")
        .addText((text) => {
          text
            .setPlaceholder("Default")
            .setValue(this.plugin.settings.baseUrl)
            .onChange(async (value) => {
              this.plugin.settings.baseUrl = value;
              await this.plugin.saveSettings();
            });
        });
    }

    // LLM settings
    new Setting(containerEl).setName('Model').setHeading();

    new Setting(containerEl)
    .setName("Temperature")
    .setDesc("Higher values make output more random, while lower values make it more focused and deterministic. Min: 0, Max: 2.")
    .addText((text) =>
      text
        .setValue(String(this.plugin.settings.temperature))
        .onChange(async (value) => {
          const num = Number(value);
          const isValid = !Number.isNaN(num) && num >= 0 && num <= 2;
          this.plugin.settings.temperature = isValid ? value : DEFAULT_SETTINGS.temperature;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
    .setName("Max output tokens")
    .setDesc("Set the maximum number of tokens the model can generate in its response.")
    .addText((text) =>
      text
        .setValue(String(this.plugin.settings.maxOutputTokens))
        .onChange(async (value) => {
          const num = Number(value);
          const isValid = !Number.isNaN(num) && num >= 0;
          this.plugin.settings.maxOutputTokens = isValid ? value : DEFAULT_SETTINGS.maxOutputTokens;
          await this.plugin.saveSettings();
        })
    );

    if (this.plugin.settings.provider === "google") {
      new Setting(containerEl)
      .setName("Thinking level")
      .setDesc("Set the level of reasoning the model should use. This setting only applies to Gemini 3 models, others use default reasoning level.")
        .addDropdown((dropdown: DropdownComponent) => {
          dropdown.addOption("Low", "Low");
          dropdown.addOption("High", "High");
          dropdown.addOption("Default", "Default");

          dropdown
          .setValue(this.plugin.settings.thinkingLevel)
          .onChange(async (value) => {
            this.plugin.settings.thinkingLevel = value;
            await this.plugin.saveSettings();
          });
        }
      );
    }

    // Agent rules
    const rulesSetting = new Setting(containerEl)
      .setName("Agent rules")
      .setDesc("Add an aditional set of rules to change the agent behaviour.");

    rulesSetting.settingEl.classList.add("obsidian-agent__settings-rules-container");
    rulesSetting.controlEl.classList.add("obsidian-agent__settings-rules-control");

    rulesSetting.addTextArea((text) => {
      text
        .setValue(this.plugin.settings.rules)
        .onChange(async (value) => {
          this.plugin.settings.rules = value;
          await this.plugin.saveSettings();
        });
      text.inputEl.placeholder = "E.g. Always answer in Spanish.";
      text.inputEl.rows = 4;
      text.inputEl.classList.add("obsidian-agent__settings-rules-textarea");
    });

    // History settings
    new Setting(containerEl).setName('History').setHeading();


    // Chat history folder
    new Setting(containerEl)
    .setName("Chat history folder")
    .setDesc("Select the folder where your chat histories will be saved.")
    .addDropdown((dropdown: DropdownComponent) => {
      const folders = this.app.vault.getAllLoadedFiles().filter(file => file instanceof TFolder && !file.isRoot());
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

    // Max turns settings
    new Setting(containerEl)
      .setName("Max history messages")
      .setDesc("Set the maximum number of previous turns (user & bot messages) to include in the memory history. Min value of 1.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.maxHistoryTurns))
          .onChange(async (value) => {
            const n = Number(value);
            this.plugin.settings.maxHistoryTurns = (!Number.isNaN(n) && n > 0) ? n : DEFAULT_SETTINGS.maxHistoryTurns;
            await this.plugin.saveSettings();
          })
      );

    // Agent skills
    new Setting(containerEl).setName('Agent skills').setHeading();

    new Setting(containerEl)
      .setName("Generate chat name")
      .setDesc("The model will automatically generate a name for the chat based on your first message.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.generateChatName)
          .onChange(async (value) => {
            this.plugin.settings.generateChatName = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Read images")
      .setDesc("The model will generate captions of the images to understand them, only when reading a note. Otherwise, images will be removed and only text content will be readed.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.readImages)
          .onChange(async (value) => {
            this.plugin.settings.readImages = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Review changes")
      .setDesc("Open a modal every time you execute the edit note tool to review the changes made by the agent.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.reviewChanges)
          .onChange(async (value) => {
            this.plugin.settings.reviewChanges = value;
            await this.plugin.saveSettings();
          })
      );

    // Developer settings
    new Setting(containerEl).setName('Developer').setHeading();

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

    new Setting(containerEl)
    .setName("Reset settings")
    .setDesc("Reset settings to default values. Push the button reopen the Settings tab see the applied changes.")
    .addButton((button) => {
      button.setButtonText("Reset");
      button.onClick(async () => {
        // Reset to defaults, but keep the provider credentials (API keys) the user entered
        const { googleApiKey, anthropicApiKey, openaiApiKey, openrouterApiKey } = this.plugin.settings;
        Object.assign(this.plugin.settings, DEFAULT_SETTINGS, { googleApiKey, anthropicApiKey, openaiApiKey, openrouterApiKey });
        await this.plugin.saveSettings();
        this.render();
      });
      return button;
    });
  }
}
