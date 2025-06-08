import { Model, ModelProvider, ModelConfig, allAvailableModels } from "src/settings/models";
import { getSettings } from "src/plugin";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from '@langchain/anthropic';

// Map the model provider with its type in Langchain
const ChatModelTypeMap = {
    [ModelProvider.OPENAI]: ChatOpenAI,
    [ModelProvider.GOOGLE]: ChatGoogleGenerativeAI,
    [ModelProvider.ANTHROPIC]: ChatAnthropic,
} as const;

// Class that creates the model
export class ModelManager {
    private static instance: ModelManager;

    // Maps the api key in the settings with its provider
    private readonly providerApiKeyMap: Record<ModelProvider, () => string> = {
        [ModelProvider.OPENAI]: () => getSettings().openaiApiKey,
        [ModelProvider.GOOGLE]: () => getSettings().googleApiKey,
        [ModelProvider.ANTHROPIC]: () => getSettings().anthropicApiKey,
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
        const baseConfig: ModelConfig = {
            modelName: model.name,
            temperature: 0.7, // DEFAULT
            streaming: true, // DEFAULT
            maxRetries: 3, // DEFAULT
            apiKey: this.providerApiKeyMap[model.provider](),
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
            
            default:
                throw new Error(`Unsupported provider: ${model.provider}`);
        }
    }

    // Returns the Langchain model ready to invoke
    public getModel() {
        const settings = getSettings();
        
        const model = allAvailableModels.find(m => m.name === settings.model);
        if (!model) throw new Error ("No model was provided in the settings");
        
        const config: ModelConfig = this.getModelConfig(model);
        const ChatModelClass = ChatModelTypeMap[model.provider];

        const chatModel = new ChatModelClass({
            model: config.modelName,
            temperature: config.temperature,
            maxRetries: config.maxRetries,
            apiKey: config.apiKey,
            streaming: config.streaming,
            safetySettings: config.safetySettings,
        })

        return chatModel;
    }
}