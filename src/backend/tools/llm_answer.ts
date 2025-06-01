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

    let language = plugin.settings.language || 'en';

    // Declare prompts
    let sysPrompt = 'You are a helpful assistant';
    let prompt = 'Answer: ' + question;
    // If context is provided, use it to answer the question
    if (context) prompt += ` Take into account the following context: ${context}`;

    // If the language is set to Spanish, change the prompts accordingly
    if (language === 'es') {
        sysPrompt = 'Eres un asistente útil';
        prompt = 'Responde: ' + question;
        // If context is provided, use it to answer the question
        if (context) prompt += ` Ten en cuenta el siguiente contexto: ${context}`;    
    }
    
    // Ask the LLM for the asnwer
    let response: any;
    try {
        const model = plugin?.settings?.model ?? 'gemini-1.5-flash';
        // Choose the apiKey depending on the provider
        let apiKey: string = '';
        const provider = plugin.settings.provider;
        if (provider === 'google') {
            if (!plugin.settings.googleApiKey) throw new Error("Google API key is required for Google provider.");
            apiKey = plugin.settings.googleApiKey;
        } else if (provider === 'openai') {
            if (!plugin.settings.openaiApiKey) throw new Error("OpenAI API key is required for OpenAI provider.");
            apiKey = plugin.settings.openaiApiKey;
        } else if (provider === 'anthropic') {
            if (!plugin.settings.anthropicApiKey) throw new Error("Anthropic API key is required for Anthropic provider.");
            apiKey = plugin.settings.anthropicApiKey;
        }

        const llm = getLLM(provider, model, apiKey);
        if (!llm) throw new Error("Failed to initialize LLM");
        
        response = await llm.invoke([
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
