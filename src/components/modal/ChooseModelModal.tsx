import { FuzzySuggestModal, App } from 'obsidian';
import { getSettings } from 'src/plugin';
import { Model, allAvailableModels } from 'src/settings/models';

export class ChooseModelModal extends FuzzySuggestModal<Model> {
  private onChoose: (model: Model) => void;
  protected activeModel: string;
  protected availableModels: Model[];

  constructor(app: App, onChoose: (model: Model) => void) {
    super(app)
    const settings = getSettings(); 
    this.onChoose = onChoose;
    this.activeModel = settings.model;
    this.availableModels = allAvailableModels;
  }

  protected formatModelName(model: Model, isActive: boolean): string {
    let name = model.name;
    if (isActive) name += " (current)";
    return name;
  }

  getItems(): Model[] {
    return this.availableModels;
  }

  getItemText(item: Model): string {
    const isActive = item.name === this.activeModel;
    return this.formatModelName(item, isActive);
  }

  onChooseItem(item: Model): void {
    this.onChoose(item);
    this.close();
  }
}