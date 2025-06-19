
## ⚠️ Disclosures

### Network Use
This plugin connects to remote AI services (OpenAI, Google, Anthropic, Mistral) to process your requests. These services are used to:
- Generate, edit, or summarize note content using advanced language models.
- Provide intelligent search and context-aware suggestions.

> **Why is this needed?**
> The AI models that power these features run on external servers and require an internet connection. Your notes or queries are sent securely to the selected provider for processing, and the results are returned to your vault.

### API Keys
To use these AI services, you must provide an API key for your chosen provider (OpenAI, Google, Anthropic, or Mistral). You can choose which provider to use, and you are responsible for obtaining and managing your API keys. If you do not provide an API key, AI features will not be available.

### Accessing Files Outside of Obsidian Vaults
This plugin is designed to only access files within your Obsidian vault. It does **not** access files outside your vault unless you explicitly attach them (e.g., images for multimodal AI processing). This is necessary to:
- Allow the AI to read and process images or files you choose to share for enhanced context or multimodal tasks.

### Image Attachments
If you wish, you can attach images to your chat or note interactions. The selected AI model will be able to read and interpret these images to provide richer, more context-aware responses. This is optional and under your control.