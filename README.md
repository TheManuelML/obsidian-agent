src/backend/agent.ts
Agent and LLM configuration
- Dinamically chages the LLM choosed in the settings tab

src/backend/tools/obsidian.ts
Obsidian related tools
- Write note
- Read note

src/components/Chat.tsx
Chat component.

src/components/Input.tsx
Input component to communicate with the agent.

src/components/ui/Dropdown.tsx
Dropdown component used in the Input.tsx component

src/layout/ChatView.tsx
Sidebar where the Chat and the Input components are shown

src/layout/SettingsTab.tsx
Settings tab for the plugin

src/utils/files.ts
Functions to list files, directories, and search files by name

src/plugin.ts
The plugin class, it import everything above (SettingsTab and ChatView)

src/main.ts
The file that it is going to be compiled