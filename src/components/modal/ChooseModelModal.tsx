import { FuzzySuggestModal, App } from 'obsidian';
import { getPlugin } from 'src/plugin';
import { allAvailableModels } from 'src/settings/providers';
import { Model } from 'src/types';

export class ChooseModelModal extends FuzzySuggestModal<Model> {
  private onChoose: (model: Model) => void;
  protected activeModel: string;
  protected availableModels: Model[];

  constructor(app: App, onChoose: (model: Model) => void) {
    super(app)
    const plugin = getPlugin(); 
    this.onChoose = onChoose;
    this.activeModel = plugin.settings.model;
    this.availableModels = allAvailableModels;
  }

  protected getModels(): Model[] {
    return this.availableModels;
  }

  protected formatNoteTitle(model: Model, isActive: boolean): string {
    let name = model.name;
    if (isActive) model.name += " (current)";
    return name;
  }

  getItems(): Model[] {
    return this.availableModels;
  }

  getItemText(item: Model): string {
    const isActive = item.name === this.activeModel;
    return this.formatNoteTitle(item, isActive);
  }

  onChooseItem(item: Model): void {
    this.onChoose(item);
    this.close();
  }
}