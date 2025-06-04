import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { create_note, read_note, edit_note } from "./tools/obsidian_files";
import { create_dir, list_files } from "./tools/obsidian_dirs";
import { rename_note, rename_dir } from "./tools/obsidian_rename";
import { search_note, search_dir } from "./tools/obsidian_search";
import { ObsidianAgentPlugin } from "../plugin";
import { getSamplePrompt, getApiKey } from "../utils/llm";
import { formatMessagesForDisplay } from "../utils/formating";

// Function to create an llm instance
export function getLLM(provider: string, model: string, apiKey: string) {
    if (provider === 'google') {
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
    } else if (provider === 'openai') {
        return new ChatOpenAI({
            model,
            temperature: 1,
            maxRetries: 2,
            apiKey,
        });
    } else if (provider === 'anthropic') {
        return new ChatAnthropic({
            model,
            temperature: 1,
            maxRetries: 2,
            apiKey,
        });
    }
}

// Function to create the agent and store it in the plugin
export function initializeAgent(plugin: ObsidianAgentPlugin) {
    if (plugin.settings.model != plugin.modelName) {
        const provider = plugin.settings.provider;
        
        // Choose the apiKey depending on the provider
        let apiKey: string = getApiKey(provider);

        const llm = getLLM(provider, plugin.settings.model, apiKey);
        if (!llm) throw new Error("Failed to initialize LLM");
        
        // MemorySaver works in the RAM. Each time agent is initialized, we create a new instance of MemorySaver.
        // Use settings: amountOfMessagesInMemory
        // This allows the agent to read N numbers of messages in the chat history just after a restart.
        const memorySaver = new MemorySaver();
        
        plugin.agent = createReactAgent({
            llm,
            tools: [
                create_note,
                read_note,
                edit_note,
                create_dir,
                list_files,
                search_note,
                search_dir,
                rename_dir,
                rename_note,
            ],
            checkpointSaver: memorySaver,
        });

        // Recycle the memory saver, only create a new one if it doesn't exist
        if (!plugin.memorySaver) plugin.memorySaver = new MemorySaver();

        // Update the model name
        plugin.modelName = plugin.settings.model;
    }
}

// Function to call the agent
export async function callAgent(
    plugin: ObsidianAgentPlugin,
    message: string,
    threadId: string,
    images: string[] = [],
    lastMessages: Message[] = []
): Promise<string> {
    initializeAgent(plugin);
    const agent = plugin.agent;
    if (!agent) throw new Error("Agent is not initialized");
    
    let sysPrompt = getSamplePrompt('agent', plugin.settings.language);
    // Change the system prompt
    if (plugin.settings.rules) sysPrompt += `\n###\nFollow this rules: ${plugin.settings.rules}\n###\n`;
    if (lastMessages.length > 0) sysPrompt += `\n###\nRemember the last ${plugin.settings.amountOfMessagesInMemory} messages:\n${formatMessagesForDisplay(lastMessages)}\n###\n`;
    
    // Add the system prompt and user message to the message content
    const messageContent: Array<{ type: string, text?: string, image_url?: { url: string } }> = [];
    messageContent.push({ type: "text", text: `System Prompt:\n###\n${sysPrompt}\n###\n\nUser Prompt:\n${message}` });

    // Add images to the message
    if (images && images.length > 0) {
        for (const base64 of images) {
            messageContent.push({ type: "image_url", image_url: { url: base64 } });
        }
    }

    // Invoke the agent
    let response: Promise<{ messages: { content: string }[] }>;
    response = agent.invoke(
        // WE CANOT USE SystemMessage here, because VertexAI and GoogleGenerativeAI do not support it
        // Issue: https://github.com/langchain-ai/langgraph/issues/628
        {messages: [new HumanMessage({ content: messageContent })]},
        {configurable: { thread_id: threadId }},
    ) as Promise<{ messages: { content: string }[] }>;

    // Handle timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Agent timeout")), 20000) // 20 seconds
    );

    // Wait for the agent to finish or timeout
    const agentFinalState = await Promise.race([response, timeoutPromise]);

    // Validate response
    if (agentFinalState.messages && agentFinalState.messages.length > 0) {
        // Return the content of the last message
        return agentFinalState.messages[agentFinalState.messages.length - 1].content;
    } else {
        throw new Error("No messages returned from agent.");
    }
}