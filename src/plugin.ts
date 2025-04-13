import React from "react";
import ReactDOM from "react-dom/client";

import { Plugin, PluginSettingTab, App, Modal } from "obsidian";

import { SettingsTab } from "./ui/components/SettingsTab";
import { AgentInput } from "./ui/components/AgentInput";


// Main plugin class
export class ObsidianAgentPlugin extends Plugin {
  async onload() {
    // Add settings tab
    this.addSettingTab(new AgentSettingsTab(this.app, this));
    
    // Add sidebar ribon icon
    const mountPoint = this.addRibbonIcon('brain-cog', 'Obsidian Agent', (evt: MouseEvent) => {
      // Display AgentInput modal
      const agentInput = new AgentInputModal(this.app).open();
    });
  }
}

// Settings tab
export class AgentSettingsTab extends PluginSettingTab {
  plugin: ObsidianAgentPlugin;

  constructor(app: App, plugin: ObsidianAgentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const mountPoint = containerEl.createDiv();
    const root = ReactDOM.createRoot(mountPoint);
    root.render(React.createElement(SettingsTab));
  }
}

// Modal (AgentInput)
export class AgentInputModal {
  app: App;
  modal: Modal;

  constructor(app: App) {
    this.app = app;
    this.modal = new Modal(app);
  }

  open() {
    this.modal.open();
    const mountPoint = this.modal.contentEl.createDiv();
    const root = ReactDOM.createRoot(mountPoint);
    root.render(React.createElement(AgentInput));
  }
}
