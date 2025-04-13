import React from "react";


// Settings tab component
// This component is used to render the settings tab in the plugin settings
export function SettingsTab() {
  return (
    <div>
      <h1>Agent Settings</h1>
      <div>
        <h4>Select a language</h4>
        <select name="settings-language-select" id="settings-language">
          <option value="es">Spanish</option>
          <option value="en">English</option>
        </select>

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
