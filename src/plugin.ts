import { Plugin, App, WorkspaceLeaf } from 'obsidian';
import { MemorySaver } from '@langchain/langgraph';
import { AgentChatView, VIEW_TYPE_AGENT } from "./layout/ChatView";
import { AgentSettings, AgentSettingsTab, DEFAULT_SETTINGS } from "./layout/SettingsTab";
import { Runnable } from '@langchain/core/runnables';

let pluginInstance: ObsidianAgentPlugin;

// Main plugin class
export class ObsidianAgentPlugin extends Plugin {
  settings!: AgentSettings;

  // Properties for the agent
  agent?: Runnable;
  memorySaver?: MemorySaver;

  // Method that loads the plugin
  async onload() {
    pluginInstance = this;
    setPlugin(this);

    // Add settings tab
    await this.loadSettings();
    this.addSettingTab(new AgentSettingsTab(this.app, this));

    // Add agent chat view
    this.registerView(VIEW_TYPE_AGENT, (leaf) => new AgentChatView(leaf, this)); 
    this.app.workspace.onLayoutReady(async () => {
      await this.ensureAgentViewExists();
    });

    // Add sidebar ribon icon that shows the view
    this.addRibbonIcon('brain-cog', 'Chat with Agent', () => {
      this.activateAgentChatView();
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
  async onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_AGENT).forEach((leaf) => leaf.detach());
  }
}

// Function that returns the app property of the Plugin class
export function getApp(): App {
  return pluginInstance.app
}

export function setPlugin(p: ObsidianAgentPlugin) {
  pluginInstance = p;
}

export function getPlugin(): ObsidianAgentPlugin {
  if (!pluginInstance) {
    throw new Error("Plugin instance not set yet");
  }
  return pluginInstance;
}