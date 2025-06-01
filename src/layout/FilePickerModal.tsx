import { SuggestModal, TFile, App } from 'obsidian';

export class FilePickerModal extends SuggestModal<TFile> {
  private onChoose: (file: TFile) => void;

  constructor(app: App, onChoose: (file: TFile) => void) {
    super(app);
    this.onChoose = onChoose;
    this.setPlaceholder('Search for a file…');
  }

  getSuggestions(query: string): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  renderSuggestion(item: TFile, el: HTMLElement): void {
    el.setText(item.path.slice(0, -3));
  }

  onChooseSuggestion(item: TFile, evt: MouseEvent | KeyboardEvent): void {
    this.onChoose(item);
    this.close();
  }
}
