import { HumanMessage, SystemMessage } from "langchain";
import { ModelManager } from "src/backend/managers/modelManager";

// Function that calls the agent
export async function callModel(
  system: string,
  user: string,
  base64Images: Array<{base64: string, mimeType: "image/png" | "image/jpeg"}>,
  webSearch: boolean = false, // If to use web search
) {
  // Get the instance of the model
  const llm = ModelManager.getInstance().getModel();
  // Prepare the inputs
  const input = await prepareModelInputs(system, user, base64Images);
  
  if (webSearch) {
    // Create tool
    const searchTool = {
      googleSearch: {}
    };

    // Bind the web search tool to the model
    // And call the model
    const response = await llm
      .bindTools([searchTool])
      .invoke(input);

    //! Sources cannot be extracted yet
    //! https://github.com/langchain-ai/langchainjs/issues/9264

    return {
      response: response.content.toString(),
      //sources: [],
    };
  }

  // Call the model
  const response = await llm.bindTools([]).invoke(input);
  return response.content.toString();
}

// Function that prepare the prompts into inputs for the agent
async function prepareModelInputs(
  system: string,
  user: string,
  filesBase64: Array<{base64: string, mimeType: "image/png" | "image/jpeg"}>,
) {
  const inputs: Array<{
    type: "text" | "image",
    text?: string,
    source_type?: "base64"
    data?: string,
    mime_type?: "image/png" | "image/jpeg",
  }> = [{ type: "text", text: user }];

  if (filesBase64 && filesBase64.length > 0) {
    for (const f64 of filesBase64) {
      inputs.push({
        type: "image",
        source_type: "base64",
        data: f64.base64,
        mime_type: f64.mimeType,
      })
    }
  }

  return [
    new SystemMessage({content: system}),
    new HumanMessage({ content: inputs })
  ]
}
