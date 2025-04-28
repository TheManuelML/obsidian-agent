import { ItemView, WorkspaceLeaf, IconName } from 'obsidian';
import ReactDOM from 'react-dom/client';
import { AgentInput } from '../components/AgentInput';


export const VIEW_TYPE_AGENT = 'agent-chat-view';

export class AgentChatView extends ItemView {
  private reactRoot: ReactDOM.Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_AGENT;
  }

  getDisplayText(): string {
    return 'Obsidian Agent';
  }

  getIcon(): IconName {
    return 'brain-cog'
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();

    this.reactRoot = ReactDOM.createRoot(container);
    this.reactRoot.render(<AgentInput />);
  }

  async onClose(): Promise<void> {
    this.reactRoot?.unmount();
  }
}
