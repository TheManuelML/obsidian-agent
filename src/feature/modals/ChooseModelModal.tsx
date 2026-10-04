import { FuzzySuggestModal, App, FuzzyMatch } from 'obsidian';
import { getSettings } from 'src/plugin';
import { suggestedModels } from 'src/settings/models';
import { Provider, SelectedModel, SuggestedModel } from 'src/types/ai';

// Color shown next to each suggestion, one per provider
const providerColorMap: Record<Provider, string> = {
  google: "#7895F9",
  anthropic: "#D97757",
  openai: "#74AA9C",
  openrouter: "#6467F2",
  ollama: "#CCCCCC",
};

const providerLabelMap: Record<Provider, string> = {
  google: "Google",
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
  ollama: "Ollama",
};

// Lets the user pick a provider + model name from a curated list of
// suggestions. Picking an item only seeds the settings fields — the user
// can still freely edit the model name afterwards.
export class ChooseModelModal extends FuzzySuggestModal<SuggestedModel> {
  private onChoose: (selected: SelectedModel) => void;
  protected activeModel: string;
  protected suggestions: SuggestedModel[];

  constructor(app: App, onChoose: (selected: SelectedModel) => void) {
    super(app)
    const settings = getSettings();
    this.onChoose = onChoose;
    this.activeModel = settings.model;
    this.suggestions = suggestedModels;
  }

  getItems(): SuggestedModel[] {
    return this.suggestions;
  }

  getItemText(item: SuggestedModel): string {
    return `${providerLabelMap[item.provider]} ${item.name}`;
  }

  onChooseItem(item: SuggestedModel): void {
    this.onChoose({ provider: item.provider, name: item.name });
    this.close();
  }

  renderSuggestion(modelMatch: FuzzyMatch<SuggestedModel>, el: HTMLElement): void {
    const { item: model } = modelMatch;
    el.empty();

    const color = providerColorMap[model.provider] || "#CCCCCC";

    const wrapper = el.createDiv({ cls: "obsidian-agent__model-modal__suggestion-wrapper" });

    // Color circle
    wrapper.createDiv({ cls: "obsidian-agent__model-modal__color-circle", attr: { style: `background: ${color}` } });

    // Text container
    const textContainer = wrapper.createDiv({ cls: "obsidian-agent__model-modal__text-container" });

    const nameEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__name" });
    nameEl.setText(model.name + (model.name === this.activeModel ? " (current)" : ""));

    const providerEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__info-bold" });
    providerEl.setText(`Provider: ${providerLabelMap[model.provider]}`);

    const descEl = textContainer.createDiv({ cls: "obsidian-agent__model-modal__info" });
    descEl.setText(`${model.description}`);
  }
}
