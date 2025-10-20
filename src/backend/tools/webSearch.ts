import { GoogleGenAI } from "@google/genai";
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getSettings } from "src/plugin";

// Tool to search notes and folders
export const webSearch = tool(async (input) => {
  // Declare input
  const { query } = input;
  const modelName: string = getSettings().model;

  let response;
  try {
    const ai = new GoogleGenAI({apiKey: getSettings().googleApiKey});

    const groundingTool = {
      googleSearch: {
        
      },
    };
  
    response = await ai.models.generateContent({
      model: modelName,
      contents: query,
      config: {
        tools: [groundingTool],
      },
    });
  } catch (error) {
    return {
      success: false,
      response: String(error),
    }
  }

  return {
    success: true,
    response: response.text
  };
}, {
  // Tool schema and metadata
  name: 'web_search',
  description: 'Search someting in the web',
  schema: z.object({
      query: z.string().describe('Query for the web search')
  })
});