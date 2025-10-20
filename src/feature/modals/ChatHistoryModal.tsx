import { FuzzySuggestModal, TFile, App } from 'obsidian';
import { getSettings } from 'src/plugin';

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
}