import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { create_note, read_note } from "./tools/obsidian";
import { ObsidianAgentPlugin } from "../plugin";
import { read } from "fs";

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

// Function to call the agent
export async function callAgent(
    plugin: ObsidianAgentPlugin,
    message: string,
    threadId: string
): Promise<string> {
    const modelName = plugin.settings.model;
    const apiKey = plugin.settings.apiKey;
    const llm = getLLM(modelName, apiKey);

    // Creates the agent
    const agent = createReactAgent({
        llm: llm,
        tools: [create_note, read_note],
        checkpointSaver: new MemorySaver(),
    });

    const invokePromise = agent.invoke(
        {messages: [new HumanMessage(message)]}, 
        {configurable: { thread_id: threadId }},
    ) as Promise<{ messages: { content: string }[] }>;

    // Handle timeout
    const timeoutPromise: Promise<never> = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Agent timeout")), 10000) // 10 segundos
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