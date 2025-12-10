import { FuzzySuggestModal, TFile, App, FuzzyMatch } from 'obsidian';
import { getSettings } from 'src/plugin';
import { Message } from 'src/types/chat';
import { importConversation } from 'src/utils/chat/chatHistory';

export class ChatHistoryModal extends FuzzySuggestModal<TFile> {
  private onChoose: (file: TFile) => void;
  protected activeChat: TFile | null;
  protected availableChats: TFile[];

  constructor(app: App, activeChat: TFile | null, onChoose: (file: TFile) => void) {
    super(app);
    this.onChoose = onChoose;
    this.activeChat = activeChat;
    this.availableChats = this.getOrderedChats();
  }

  protected getOrderedChats(): TFile[] {
    const settings = getSettings();
    const folder = this.app.vault.getFolderByPath(settings.chatsFolder);

    if (!folder) {
        if (settings.debug) console.error("The folder that stores the chats does not exist.");
        // Create a new folder
        this.app.vault.createFolder(settings.chatsFolder);
        return []; // Return empty array if folder doesn't exist
    }
    return folder.children.filter(
      (child): child is TFile => child instanceof TFile && child.extension === "md"
    );
  }

  protected formatChatTitle(basename: string, isActive: boolean): string {
    let title = basename;
    if (isActive) {
      title += " (current)";
    }
    return title;
  }

  getItems(): TFile[] {
    return this.availableChats;
  }

  getItemText(item: TFile): string {
    const isActive = item.path === this.activeChat?.path;
    return this.formatChatTitle(item.basename, isActive);
  }

  onChooseItem(item: TFile): void {
    this.onChoose(item);
    this.close();
  }

  async renderSuggestion(chatMatch: FuzzyMatch<TFile>, el: HTMLElement): Promise<void> {
    const { item: chat } = chatMatch;
    el.empty();

    const wrapper = el.createDiv({ cls: "obsidian-agent__model-modal__suggestion-wrapper" });

    // Text container
    const textContainer = wrapper.createDiv({ cls: "obsidian-agent__model-modal__text-container" });

    const nameEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__name" });
    nameEl.setText(chat.basename + (chat === this.activeChat ? " (current)" : ""));

    const firstMessagePreview = textContainer.createDiv({ cls: "obsidian-agent__model-modal__info" });
    const conversation: Message[] = await importConversation(chat);
    const len = conversation.length;
    firstMessagePreview.setText(
      conversation.length > 0 ?
        conversation[len - 1].content.length > 50 ?
          `${conversation[len - 1].content.slice(0, 50).replace("\n", " ")}...` :
          `${conversation[len - 1].content.replace("\n", " ")}` :
        `empty chat`
    );
  }
}