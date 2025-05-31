import { tool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from 'zod';
import { getLLM } from "../agent";
import { getPlugin } from "../../plugin";

// Tool to answer a request using an LLM
export const llm_answer = tool(async (input) => {
    // Declaring plugin and inputs
    const plugin = getPlugin();
    const { question, context } = input;

    // Declare prompts
    let sysPrompt = 'You are a helpful assistant'
    let prompt = 'Answer: ' + question;

    // If context is provided, use it to answer the question
    if (context) prompt += `Take into acount the following context: ${context}`;

    // Ask the LLM for the asnwer
    let response: any;
    try {
        const model = plugin?.settings?.model ?? 'gemini-1.5-flash';
        const apiKey = plugin?.settings?.apiKey ?? '';

        response = await getLLM(model, apiKey).invoke([
            new SystemMessage(sysPrompt),
            new HumanMessage(prompt),
        ]);
    
        response = response.content;
    } catch (err) {
        console.error('Error invoking LLM:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    return {
        success: true,
        question: question,
        context: context || '',
        answer: response,
    }
}, {
    // Tool schema and metadata
    name: 'answer', 
    description: 'Answer a question or a request using AI',
    schema: z.object({
        question: z.string().describe('The query, question, or request to answer'),
        context: z.string().optional().describe('The context to use for answering the question'),
    })
});
