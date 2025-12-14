import { 
  GoogleGenAI,
  GoogleGenAIOptions,
  SafetySetting,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentConfig,
  Part, 
  Type,
  ApiError,
  GenerateContentResponse,
} from '@google/genai';
import { getSettings } from 'src/plugin';
import { prepareModelInputs } from 'src/backend/managers/prompts/inputs';


export const webSearchFunctionDeclaration = {
  name: "web_search",
  description: "Search someting in the web",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Query for the web search",
      },
    },
    required: ["query"],
  },
};

// Do a web search using Google GenAI
export async function webSearch(
  query: string,
) {
  const settings = getSettings();

  // Initialize model and its configuration
  const config: GoogleGenAIOptions = { apiKey: settings.googleApiKey, apiVersion: "v1beta" };
  const ai = new GoogleGenAI(config);

  const safetySettings: SafetySetting[] = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  const generationConfig: GenerateContentConfig = {
    systemInstruction: "You are a web search tool that provides relevant information based on user queries.",
    safetySettings: safetySettings,
    tools: [{ googleSearch: {} }],
  };
  const inputs: Part[] = await prepareModelInputs(query, []);

  // Call the model
  let response: GenerateContentResponse | undefined;
  try {
    response = await ai.models.generateContent({
      model: settings.model,
      contents: inputs,
      config: generationConfig,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) return { success: false, response: "API quota exceeded. Please check your Google Cloud account."};
      if (error.status === 503) return { success: false, response: "API service overloaded. Please try again later." }
      return { success: false, response: `API Error: ${error.message}` };
    }
    return { success: false, response: `Unexpected Error: ${error}` };
  }
  
  if (!response || !response.text || !response.candidates) return { success: false, response: "Error: No results found."};
  
  // Extract sources from grounding metadata
  const groundingChunks = response.candidates[0].groundingMetadata?.groundingChunks || [];
  const sources: Array<{ title?: string, url?: string }> = [];
  for (const source of groundingChunks) {
    const web = source.web;
    if (web) sources.push(web);
  }

  return {
    success: true,
    response: {
      search: response.text,
      sources: sources,
    },
  }
};