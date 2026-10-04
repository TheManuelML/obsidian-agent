// Supported LangChain chat model providers. The user picks one in settings
// and types the model name manually (no curated model list anymore).
export type Provider = "google" | "anthropic" | "openai" | "openrouter" | "ollama";

// A provider/model-name pair, used by the model picker modal and the
// "switch-model" command to update settings together as a unit.
export interface SelectedModel {
  provider: Provider;
  name: string;
}

// A curated suggestion shown in the model picker. Model names are still
// typed manually in settings, this list only seeds the picker with
// well-known options per provider.
export interface SuggestedModel {
  provider: Provider;
  name: string;
  description: string;
}
