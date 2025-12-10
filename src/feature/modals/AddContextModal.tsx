import { FuzzySuggestModal, TFile, App, FuzzyMatch } from 'obsidian';

export class AddContextModal extends FuzzySuggestModal<TFile> {
  private onChoose: (file: TFile) => void;
  protected activeNote: TFile | null;
  protected availableNotes: TFile[];

  constructor(app: App, onChoose: (file: TFile) => void) {
    super(app);
    this.onChoose = onChoose;
    this.activeNote = app.workspace.getActiveFile();
    this.availableNotes = this.getOrderedNotes();
  }

  protected getOrderedNotes(excludeNotePaths: string[] = []): TFile[] {
    // Get recently opened files first
    const recentFiles = this.app.workspace
      .getLastOpenFiles()
      .map((filePath) => this.app.vault.getAbstractFileByPath(filePath))
      .filter(
        (file): file is TFile =>
          file instanceof TFile &&
          (file.extension === "md") &&
          !excludeNotePaths.includes(file.path) &&
          file.path !== this.activeNote?.path
      );

    // Get all other files that weren't recently opened
    const allFiles = this.app.vault.getMarkdownFiles();

    const otherFiles = allFiles.filter(
      (file) =>
        !recentFiles.some((recent) => recent.path === file.path) &&
        !excludeNotePaths.includes(file.path) &&
        file.path !== this.activeNote?.path
    );

    // Combine active note (if exists) with recent files and other files
    return [...(this.activeNote ? [this.activeNote] : []), ...recentFiles, ...otherFiles];
  }

  protected formatNoteTitle(basename: string, isActive: boolean): string {
    let title = basename;
    if (isActive) {
      title += " (current)";
    }
    return title;
  }

  getItems(): TFile[] {
    return this.availableNotes;
  }

  getItemText(item: TFile): string {
    const isActive = item.path === this.activeNote?.path;
    return this.formatNoteTitle(item.basename, isActive);
  }

  onChooseItem(item: TFile): void {
    this.onChoose(item);
    this.close();
  }

  renderSuggestion(item: FuzzyMatch<TFile>, el: HTMLElement): void {
    const { item: file } = item;
    el.empty();

    const wrapper = el.createDiv({ cls: "obsidian-agent__model-modal__suggestion-wrapper" });

    // Text container
    const textContainer = wrapper.createDiv({ cls: "obsidian-agent__model-modal__text-container" });

    const nameEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__name" });
    const isActive = file.path === this.activeNote?.path;
    nameEl.setText(this.formatNoteTitle(file.basename, isActive));

    const pathEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__info" });
    pathEl.setText(file.path);
  }
}