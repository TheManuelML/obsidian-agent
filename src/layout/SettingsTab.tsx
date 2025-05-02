import React from "react";
import ReactDOM from "react-dom/client";
import { PluginSettingTab, App } from "obsidian";
import { ObsidianAgentPlugin } from "../plugin";

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

// Settings tab component
export function SettingsTab() {
  return (
    <div>
      <h1>Agent Settings</h1>
      <div>
        <h4>Select a model</h4>
        <select name="settings-model-select" id="settings-model">
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gemini-2.0-fash">Gemini 2.0 Flash</option>
        </select>    
      </div>
    </div>
  );
}
