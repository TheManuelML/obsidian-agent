import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { create_note, read_note, edit_note } from "./tools/obsidian_files";
import { create_dir, list_files } from "./tools/obsidian_dirs";
import { rename } from "./tools/obsidian_rename";
import { search } from "./tools/obsidian_search";
import { getPlugin, getSettings } from "../plugin";
import { getSamplePrompt } from "../utils/llm";
import { formatMessagesForDisplay } from "../utils/formating";
import { Message } from "src/types";
import { ModelManager } from "./router/modelManager";

// Function to create the agent and store it in the plugin
export function initializeAgent() {
    const plugin = getPlugin();
    const settings = getSettings();
    
    if (settings.model != plugin.modelName) {
        const llm = ModelManager.getInstance().getModel();
        if (!llm) throw new Error("Failed to initialize LLM with LangChain");
        
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
                search,
                rename,
            ],
            checkpointSaver: memorySaver,
        });

        // Recycle the memory saver, only create a new one if it doesn't exist
        if (!plugin.memorySaver) plugin.memorySaver = new MemorySaver();

        // Update the model name
        plugin.modelName = settings.model;
    }
}

// Function to call the agent
export async function callAgent(
    message: string,
    threadId: string,
    images: string[] = [],
    lastMessages: Message[] = []
): Promise<string> {
    const plugin = getPlugin();
    const settings = getSettings();

    initializeAgent();
    const agent = plugin.agent;
    if (!agent) throw new Error("Agent is not initialized");
    
    let sysPrompt = getSamplePrompt('agent');
    // Change the system prompt
    if (settings.rules) sysPrompt += `\n###\nFollow this rules: ${settings.rules}\n###\n`;
    if (lastMessages.length > 0) sysPrompt += `\n###\nRemember the last ${settings.amountOfMessagesInMemory} messages:\n${formatMessagesForDisplay(lastMessages)}\n###\n`;
    
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