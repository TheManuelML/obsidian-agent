import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ModelManager } from "src/backend/managers/modelManager";
import { imageToBase64 } from "src/utils/parsing/imageBase64";

// Function that calls the agent
export async function callModel(
  system: string,              // System prompt
  user: string,                // Prompt
  files: File[],               // Images
  base64Images: string[],      // Encoded images
  webSearch: boolean = false,  // If to use web search
) {
  // Get the instance of the model
  const llm = ModelManager.getInstance().getModel();
  // Prepare the inputs
  const input = await prepareModelInputs(system, user, files, base64Images);
  
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

    type GroundingChunk = {
      web: {
        uri: string,
        title: string,
      }
    };
    // const urls: string[] = response.response_metadata.groundingMetadata.groundingChunks.map(((chunk: GroundingChunk) => {
    //   return chunk.web.uri;
    // }));

    return {
      response: response.content.toString(),
      sources: [],
    };
  }

  // Call the model
  const response = await llm.invoke(input);
  return response.content.toString();
}

// Function that prepare the prompts into inputs for the agent
async function prepareModelInputs(
  system: string,
  user: string,
  files: File[],
  filesBase64: string[],
) {
  const inputs: Array<{
    type: "text" | "image",
    text?: string,
    source_type?: "base64"
    data?: string,
  }> = [{ type: "text", text: user }];

  // If files, encode them for a multimodal call
  if (files && files.length > 0) {
    for (const file of files) {
      filesBase64.push(await imageToBase64(file));
    }
  }

  if (filesBase64 && filesBase64.length > 0) {
    for (const f64 of filesBase64) {
      inputs.push({
        type: "image",
        source_type: "base64",
        data: f64,
      })
    }
  }

  return [
    new SystemMessage({content: system}),
    new HumanMessage({ content: inputs })
  ]
}
