import { FuzzySuggestModal, App, FuzzyMatch } from 'obsidian';
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
      google: "#4285F4",
      openai: "#10A37F",
      anthropic: "#E87C5C",
      mistral: "#F39C12",
      ollama: "#FF6B6B"
    };
    const color = providerColorMap[model.provider.toLowerCase()] || "#CCCCCC";
  
    const wrapper = el.createDiv({
      attr: {
        style: `
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px;
        `
      }
    });
  
    // Color circle
    const colorCircle = wrapper.createDiv({
      attr: {
        style: `
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: ${color};
          flex-shrink: 0;
        `
      }
    });
  
    // Text container
    const textContainer = wrapper.createDiv({
      attr: {
        style: `
          display: flex;
          flex-direction: column;
        `
      }
    });
  
    const nameEl = textContainer.createDiv({
      attr: {
        style: `
          font-weight: bold;
          margin-bottom: 2px;
        `
      }
    });
    nameEl.setText(model.name + (model.name === this.activeModel ? " (current)" : ""));
  
    const providerEl = textContainer.createDiv({
      attr: {
        style: `
          font-size: 0.85em;
          color: var(--text-muted);
        `
      }
    });
    providerEl.setText(`Provider: ${model.provider}`);

    let capabilities = "text, " + model.capabilities.join(", ")
    if (!model.capabilities || model.capabilities.length < 1) {
      capabilities = "text-only"
    } 
    const capsEl = textContainer.createDiv({
      attr: {
        style: `
          font-size: 0.85em;
          color: var(--text-muted);
        `
      }
    });
    capsEl.setText(`Capabilities: ${capabilities}`);
  }
}