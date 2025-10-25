import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { callModel } from "src/backend/managers/modelRunner";

// Tool to search notes and folders
export const webSearch = tool(async (input) => {
  // Declare input
  const { query } = input;
  
  try {
    const groundingSearch = await callModel("You are a helpful assistant", query, [], [], true);
  
    if (typeof groundingSearch === "string") {
      return { success: false, error: 'Web search failed: ' + groundingSearch};
    }
  
    return {
      success: true,
      query,
      response: groundingSearch.response,
      sources: groundingSearch.sources,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: `An error occurred during web search: ${errorMsg}` };
  }
}, {
  // Tool schema and metadata
  name: 'web_search',
  description: 'Search someting in the web',
  schema: z.object({
    query: z.string().describe('Query for the web search')
  })
});