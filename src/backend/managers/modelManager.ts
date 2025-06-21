import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatDeepSeek } from "@langchain/deepseek";
import { Notice } from "obsidian";
import { getSettings } from "src/plugin";
import { Model, ModelProvider, ModelConfig, allAvailableModels } from "src/settings/models";

// Class that creates the model based on the provider
export class ModelManager {
    private static instance: ModelManager;

    // Maps the api key in the settings with its provider
    private readonly providerApiKeyMap: Record<ModelProvider, () => string> = {
        [ModelProvider.OPENAI]: () => getSettings().openaiApiKey,
        [ModelProvider.GOOGLE]: () => getSettings().googleApiKey,
        [ModelProvider.ANTHROPIC]: () => getSettings().anthropicApiKey,
        [ModelProvider.MISTRAL]: () => getSettings().mistralApiKey,
        [ModelProvider.DEEPSEEK]: () => getSettings().deepseekApiKey,
    }

    // Function to get the ModelManager instance
    static getInstance(): ModelManager {
        if (!ModelManager.instance) {
            ModelManager.instance = new ModelManager;
        }
        return ModelManager.instance;
    }

    // Gets the model configuration depending on the provider
    public getModelConfig(model: Model): ModelConfig {
        const settings = getSettings();
        const providerApiKey = this.providerApiKeyMap[model.provider]();
        if (!providerApiKey) {
            const errorMsg = `API key for provider ${model.provider}, is not set.`;
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const baseConfig: ModelConfig = {
            modelName: model.name,
            temperature: 1, // DEFAULT
            streaming: true, // DEFAULT
            maxRetries: 3, // DEFAULT
            apiKey: providerApiKey,
        };

        switch (model.provider) {
            case ModelProvider.OPENAI:
                return {
                    ...baseConfig,
                };

            case ModelProvider.GOOGLE:
                const safetySettings = [
                    {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE},
                    {category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE},
                    {category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE},
                    {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE},
                    {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE},
                ]
                return {
                    ...baseConfig,
                    safetySettings
                }

            case ModelProvider.ANTHROPIC:
                return {
                    ...baseConfig
                }

            case ModelProvider.MISTRAL:
                return {
                    ...baseConfig
                }

            case ModelProvider.DEEPSEEK:
                return {
                    ...baseConfig
                }
            
            default:
                const errorMsg = `Unsupported provider: ${model.provider}`;
                new Notice(errorMsg, 5000);
                if (settings.debug) console.error(errorMsg);
                throw new Error(errorMsg);
        }
    }

    // Returns the Langchain model ready to invoke
    public getModel() {
        const settings = getSettings();

        // Search the selected model on the model list 
        const model = allAvailableModels.find(m => m.name === settings.model);
        if (!model) {
            const errorMsg = "No model was provided in the settings";
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
            throw new Error (errorMsg);
        }
        
        // Configure the model depending on the provider
        const config: ModelConfig = this.getModelConfig(model);

        // Create the chat model based on provider
        switch (model.provider) {
            case ModelProvider.OPENAI:
                return new ChatOpenAI({
                    model: config.modelName,
                    temperature: config.temperature,
                    maxRetries: config.maxRetries,
                    apiKey: config.apiKey,
                    streaming: config.streaming,
                });

            case ModelProvider.GOOGLE:
                return new ChatGoogleGenerativeAI({
                    model: config.modelName,
                    temperature: config.temperature,
                    maxRetries: config.maxRetries,
                    apiKey: config.apiKey,
                    streaming: config.streaming,
                    safetySettings: config.safetySettings,
                });

            case ModelProvider.ANTHROPIC:
                return new ChatAnthropic({
                    model: config.modelName,
                    temperature: config.temperature,
                    maxRetries: config.maxRetries,
                    apiKey: config.apiKey,
                    streaming: config.streaming,
                });

            case ModelProvider.MISTRAL:
                return new ChatMistralAI({
                    model: config.modelName,
                    temperature: config.temperature,
                    maxRetries: config.maxRetries,
                    apiKey: config.apiKey,
                    streaming: config.streaming,
                });

            case ModelProvider.DEEPSEEK:
                return new ChatDeepSeek({
                    model: config.modelName,
                    temperature: config.temperature,
                    maxRetries: config.maxRetries,
                    apiKey: config.apiKey,
                    streaming: config.streaming,
                });

            default:
                const errorMsg = `Unsupported provider: ${model.provider}`;
                new Notice(errorMsg, 5000);
                if (settings.debug) console.error(errorMsg);
                throw new Error(errorMsg);
        }
    }
}