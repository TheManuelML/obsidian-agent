import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";

import { create_note, read_note, edit_note } from "./tools/obsidian_files";
import { create_dir, list_files } from "./tools/obsidian_dirs";
import { rename_note, rename_dir } from "./tools/obsidian_rename";
import { search_note, search_dir } from "./tools/obsidian_search";

import { ObsidianAgentPlugin } from "../plugin";
import { getSamplePrompt } from "../utils/samplePrompts";

// Function to create a Google Generative AI instance
export function getLLM(model: string, apiKey: string) {
    return new ChatGoogleGenerativeAI({
        model,
        temperature: 1,
        maxRetries: 2,
        safetySettings: [
            {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE},
            {category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE},
            {category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE},
            {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE},
            {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE},
        ],
        apiKey,
    });
}

// Function to create the agent and store it in the plugin
export function initializeAgent(plugin: ObsidianAgentPlugin) {
    if (!plugin.agent || !plugin.memorySaver) {
        console.log(plugin.memorySaver);
        console.log(plugin.agent);

        const llm = getLLM(plugin.settings.model, plugin.settings.apiKey);
        const memorySaver = new MemorySaver();
        plugin.agent = createReactAgent({
            llm,
            tools: [
                create_note, // Allow to link files
                read_note,
                edit_note, // Allow to link files
                create_dir,
                list_files,
                search_note,
                search_dir,
                rename_dir,
                rename_note,
            ],
            checkpointSaver: memorySaver,
        });
        plugin.memorySaver = memorySaver;
    }
}

// Function to call the agent
export async function callAgent(
    plugin: ObsidianAgentPlugin,
    message: string,
    threadId: string
): Promise<string> {
    initializeAgent(plugin);
    
    // Get the system prompt
    const sysPrompt = getSamplePrompt('agent');
    const userMessage = `${sysPrompt}\n\n${message}`;

    // Invoke the agent
    const invokePromise = plugin.agent!.invoke(
        {messages: [new HumanMessage(userMessage)]},
        {configurable: { thread_id: threadId }},
    ) as Promise<{ messages: { content: string }[] }>;

    // Handle timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Agent timeout")), 10000) // 10 seconds
    );

    // Wait for the agent to finish or timeout
    const agentFinalState = await Promise.race([invokePromise, timeoutPromise]);

    // Validate response
    if (agentFinalState.messages && agentFinalState.messages.length > 0) {
        // Return the content of the last message
        return agentFinalState.messages[agentFinalState.messages.length - 1].content;
    } else {
        throw new Error("No messages returned from agent.");
    }
}