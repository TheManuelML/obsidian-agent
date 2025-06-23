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

  protected getOrderedChats(excludeNotePaths: string[] = []): TFile[] {
    // Get recently opened files first
    const recentFiles = this.app.workspace.getLastOpenFiles()
      .map((filePath) => this.app.vault.getAbstractFileByPath(filePath))
      .filter(
        (file): file is TFile =>
          file instanceof TFile &&
          (file.extension === "md") &&
          !excludeNotePaths.includes(file.path) &&
          file.path !== this.activeChat?.path
      );

    // Get all other files that weren't recently opened
    const settings = getSettings();
    const folder = this.app.vault.getFolderByPath(settings.chatsFolder);
    if (!folder) {
        console.error("The folder that stores the chats does not exist.");
        throw new Error("Chats folder not found");

        // Create a new folder
    }
    const allChats = folder.children.filter(child => child instanceof TFile);

    const otherFiles = allChats.filter(
      (file) =>
        !recentFiles.some((recent) => recent.path === file.path) &&
        !excludeNotePaths.includes(file.path) &&
        file.path !== this.activeChat?.path
    );

    // Combine active note (if exists) with recent files and other files
    return [...(this.activeChat ? [this.activeChat] : []), ...recentFiles, ...otherFiles];
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