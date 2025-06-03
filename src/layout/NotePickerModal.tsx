import { SuggestModal, TFile, App } from 'obsidian';

export class NotePickerModal extends SuggestModal<TFile> {
  private onChoose: (file: TFile) => void;

  constructor(app: App, onChoose: (file: TFile) => void) {
    super(app);
    this.onChoose = onChoose;
  }

  // Override the getItems method to return the list of files
  getSuggestions(query: string): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  // Override the getItemText method to return the text for each file
  renderSuggestion(item: TFile, el: HTMLElement): void {
    el.setText(item.path.slice(0, -3));
  }

  // Override the onChooseSuggestion method to handle the selection of a file
  onChooseSuggestion(item: TFile, evt: MouseEvent | KeyboardEvent): void {
    this.onChoose(item);
    this.close();
  }
}