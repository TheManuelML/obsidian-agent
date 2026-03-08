import { 
  Part,
  ApiError,
  GenerateContentResponse,
} from "@google/genai";
import { getSettings } from "src/plugin";
import { prepareModelInputs } from "src/backend/managers/prompts/inputs";
import { createGoogleClient } from "src/backend/managers/googleClient";


// Function that calls the llm model without chat history and tools binded
export async function callModel(
  system: string,
  user: string,
  files: File[],
): Promise<string> {
  const settings = getSettings();

  // Initialize model and its configuration
  const { ai, generationConfig } = await createGoogleClient(system);

  const inputs: Part[] = await prepareModelInputs(user, files);

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
      if (error.status === 403) throw new Error("API key not set, or isn't valid.")
      if (error.status === 429) throw new Error("API quota exceeded. Please check your Google Cloud account.");
      if (error.status === 503) throw new Error("API service overloaded. Please try again later.");
      throw new Error(`API Error: ${error.message}`);
    }
    throw new Error(`Unexpected Error: ${String(error)}`);
  }

  if (!response) throw new Error("No message generated.");
  return response.text || "";
}
