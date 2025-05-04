import { createRoot, Root } from 'react-dom/client';
import { ItemView, WorkspaceLeaf, IconName } from 'obsidian';
import { ObsidianAgentPlugin } from '../plugin';
import { AgentChat } from 'src/components/AgentChat';

export const VIEW_TYPE_AGENT = 'agent-chat-view';

export class AgentChatView extends ItemView {
  plugin: ObsidianAgentPlugin;
  reactRoot: Root;

  constructor(leaf: WorkspaceLeaf, plugin: ObsidianAgentPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  // View characteristics
  getViewType(): string { return VIEW_TYPE_AGENT }
  getDisplayText(): string { return 'Obsidian Agent' }
  getIcon(): IconName { return 'brain-cog' }

  async onOpen() {
    const root = createRoot(this.containerEl);
    root.render(<AgentChat plugin={this.plugin} />);
    this.reactRoot = root;
  }

  async onClose(): Promise<void> {
    this.reactRoot.unmount();
  }
}
