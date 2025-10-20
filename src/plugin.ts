import { Plugin, App, WorkspaceLeaf } from 'obsidian';
import EventEmitter from 'events';
import { ChatView, VIEW_TYPE_AGENT } from "src/feature/chat/View";
import { ChooseModelModal } from 'src/feature/modals/ChooseModelModal';
import { AgentSettings, AgentSettingsTab } from "src/settings/SettingsTab";
import { Model } from 'src/types/ai';
import { DEFAULT_SETTINGS } from "src/settings/defaults";

let pluginInstance: ObsidianAgentPlugin;

// Main plugin class
export class ObsidianAgentPlugin extends Plugin {
  settings!: AgentSettings;
  settingsEmitter = new EventEmitter();

  // Method that loads the plugin
  async onload() {
    pluginInstance = this;
    setPlugin(this);

    // Add settings tab
    await this.loadSettings();
    this.addSettingTab(new AgentSettingsTab(this.app, this));

    // Add agent chat view
    this.registerView(VIEW_TYPE_AGENT, (leaf) => new ChatView(leaf, this)); 
    this.app.workspace.onLayoutReady(async () => {
      await this.ensureAgentViewExists();
    });

    // Add sidebar ribon icon that shows the view
    this.addRibbonIcon('brain-cog', 'Chat with Agent', () => {
      this.activateAgentChatView();
    });

    // Hotkeys
    this.addCommand({
      id: "switch-model",
      name: "Switch model",
      callback: () => {
        const app = getApp();
        const plugin = getPlugin();
        const settings = getSettings();
        
        new ChooseModelModal(app, (model: Model) => {
          // Change model in the settings and save changes
          settings.model = model.name; 
          plugin.saveSettings();
          return;
        }).open();
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.settingsEmitter.emit("settings-updated", this.settings);
  }

  // Method that ensures that the tab for the agent chat view exists
  async ensureAgentViewExists() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_AGENT);
    if (leaves.length === 0) {
      let leaf = this.app.workspace.getRightLeaf(false);
  
      // Si no existe un leaf, créalo explícitamente
      if (!leaf) {
        leaf = this.app.workspace.getRightLeaf(true); // crea uno si no hay
      }
  
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_AGENT, active: false });
      }
    }
  }
  
  // Method that opens the agent chat view
  async activateAgentChatView(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;

    const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_AGENT);
    if (existingLeaves.length > 0) {
      leaf = existingLeaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_AGENT, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  // Method that unloads the plugin
  async onunload() {}
}

// Function that returns the app property of the Plugin class
export function getApp(): App {
  if(!pluginInstance) throw new Error("Plugin instance not set yet");
  return pluginInstance.app;
}

// Function that returns the settings of the plugin
export function setPlugin(p: ObsidianAgentPlugin) {
  pluginInstance = p;
}
// Function that returns the plugin instance
export function getPlugin(): ObsidianAgentPlugin {
  if (!pluginInstance) throw new Error("Plugin instance not set yet");
  return pluginInstance;
}

// Function that return the settings
export function getSettings(): AgentSettings {
  if (!pluginInstance) throw new Error("Plugin instance not set yet");
  return pluginInstance.settings
}