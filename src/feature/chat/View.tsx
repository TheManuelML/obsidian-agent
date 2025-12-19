import { createRoot, Root } from 'react-dom/client';
import { ItemView, WorkspaceLeaf, IconName, TFile } from 'obsidian';
import { ObsidianAgentPlugin } from 'src/plugin';
import Chat, { ChatRef } from 'src/feature/chat/components/Chat';

export const VIEW_TYPE_AGENT = 'agent-chat-view';

export class ChatView extends ItemView {
  plugin: ObsidianAgentPlugin;
  reactRoot!: Root;
  private chatRef: ChatRef | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: ObsidianAgentPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  // View characteristics
  getViewType(): string { return VIEW_TYPE_AGENT }
  getDisplayText(): string { return 'Chat with agent' }
  getIcon(): IconName { return 'brain-cog' }

  async onOpen() {
    const root = createRoot(this.containerEl);
    root.render(<Chat ref={(ref) => { this.chatRef = ref; }} />);
    this.reactRoot = root;
  }

  async onClose(): Promise<void> {
    this.reactRoot.unmount();
  }

  // Get the active chat file
  getActiveChat(): TFile | null {
    return this.chatRef?.getActiveChat() ?? null;
  }

  // Get the updateConversation function
  getUpdateConversation(): ((value: any) => void) | null {
    return this.chatRef?.getUpdateConversation() ?? null;
  }

  // Set the active chat
  setActiveChat(chat: TFile | null): void {
    this.chatRef?.setActiveChat(chat);
  }
}