import { createRoot, Root } from 'react-dom/client';
import { ItemView, WorkspaceLeaf, IconName } from 'obsidian';
import { ObsidianAgentPlugin } from 'src/plugin';
import { Chat } from 'src/components/chat/Chat';

export const VIEW_TYPE_AGENT = 'agent-chat-view';

export class ChatView extends ItemView {
  plugin: ObsidianAgentPlugin;
  reactRoot!: Root;

  constructor(leaf: WorkspaceLeaf, plugin: ObsidianAgentPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  // View characteristics
  getViewType(): string { return VIEW_TYPE_AGENT }
  getDisplayText(): string { return 'Obsidian agent' }
  getIcon(): IconName { return 'brain-cog' }

  async onOpen() {
    const root = createRoot(this.containerEl);
    root.render(<Chat />);
    this.reactRoot = root;
  }

  async onClose(): Promise<void> {
    this.reactRoot.unmount();
  }
}