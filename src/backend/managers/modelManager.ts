import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { getSettings } from "src/plugin";
import { allAvailableModels } from "src/settings/models";
import { Model, ModelConfig } from "src/types/ai";

// Class that creates the model based on the provider
export class ModelManager {
  private static instance: ModelManager;

  // Function to get the ModelManager instance
  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager;
    }
    return ModelManager.instance;
  }

  // Gets the model configuration depending on the provider
  public getModelConfig(model: Model) {
    const settings = getSettings();
    const providerApiKey = settings.googleApiKey;

    const config = {
      modelName: model.name,
      streaming: true, // DEFAULT
      apiKey: providerApiKey,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    }
    return config
  }

  // Returns the Langchain model ready to invoke
  public getModel() {
    const settings = getSettings();

    // Search the selected model on the model list 
    const model = allAvailableModels.find(m => m.name === settings.model)!;

    // Configure the model depending on the provider
    const config: ModelConfig = this.getModelConfig(model);

    // Create the chat model
    return new ChatGoogleGenerativeAI({
      model: config.modelName,
      apiKey: config.apiKey,
      streaming: config.streaming,
      safetySettings: config.safetySettings,
      apiVersion: "v1beta",
    });
  }
}