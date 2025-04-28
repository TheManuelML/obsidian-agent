import React from "react";
import ReactDOM from "react-dom/client";
import { Plugin, PluginSettingTab, App, WorkspaceLeaf } from 'obsidian';

import { SettingsTab } from "./layout/SettingsTab";
import { AgentChatView, VIEW_TYPE_AGENT } from "./layout/ChatSidebar";


// Main plugin class
export class ObsidianAgentPlugin extends Plugin {
  // Method that loads the plugin
  async onload() {
    // Add settings tab
    this.addSettingTab(new AgentSettingsTab(this.app, this));
    
    // Add agent chat view
    this.registerView(VIEW_TYPE_AGENT, (leaf) => new AgentChatView(leaf)); 
    await this.ensureAgentViewExists();

    // Add sidebar ribon icon that shows the view
    this.addRibbonIcon('brain-cog', 'Obsidian Agent', () => {
      this.activateAgentChatView();
    });
  }

  // Method that ensures that the tab for the agent chat view exists
  async ensureAgentViewExists() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_AGENT);
    if (leaves.length === 0) {
      const leaf = this.app.workspace.getRightLeaf(false);
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

// Settings tab class
export class AgentSettingsTab extends PluginSettingTab {
  plugin: ObsidianAgentPlugin;

  constructor(app: App, plugin: ObsidianAgentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // Method that displays the settings tab
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const mountPoint = containerEl.createDiv();
    const root = ReactDOM.createRoot(mountPoint);
    root.render(React.createElement(SettingsTab));
  }
}
