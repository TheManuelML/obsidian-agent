import { FuzzySuggestModal, App, FuzzyMatch } from 'obsidian';
import { getSettings } from 'src/plugin';
import { allAvailableModels } from 'src/settings/models';
import { Model } from 'src/types/ai';

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
    return item.name;
  }

  onChooseItem(item: Model): void {
    this.onChoose(item);
    this.close();
  }

  renderSuggestion(modelMatch: FuzzyMatch<Model>, el: HTMLElement): void {
    const { item: model } = modelMatch;
    el.empty();
  
    // Color per provider
    const providerColorMap: Record<string, string> = {
      google: "#7895F9",
    };
    const color = providerColorMap[model.provider.toLowerCase()] || "#CCCCCC";
  
    const wrapper = el.createDiv({ cls: "obsidian-agent__model-modal__suggestion-wrapper" });
  
    // Color circle
    const colorCircle = wrapper.createDiv({ cls: "obsidian-agent__model-modal__color-circle", attr: { style: `background: ${color}` } });

    // Text container
    const textContainer = wrapper.createDiv({ cls: "obsidian-agent__model-modal__text-container" });
  
    const nameEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__name" });
    nameEl.setText(model.name + (model.name === this.activeModel ? " (current)" : ""));
  
    const providerEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__info-bold" });
    providerEl.setText(`Provider: ${model.provider}`);

    let capabilities = "text, " + model.capabilities.join(", ")
    if (!model.capabilities || model.capabilities.length < 1) {
      capabilities = "text-only"
    } 
    const capsEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__info-bold" });
    capsEl.setText(`Capabilities: ${capabilities}`);
  
    const descEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__info" });
    descEl.setText(`${model.description}`);
  }
}