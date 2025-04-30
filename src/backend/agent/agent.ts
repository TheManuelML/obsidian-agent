import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { create_note } from "./tools/obsidian";

// Configures the LLM
export const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash", // Get agent configuration from the settings tab
    temperature: 1,
    maxRetries: 2,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
    ],
    apiKey: "AIzaSyABkIqcZw9ox58Ayc8zXDPW0-TSWIiuWRc"
  });

// Creates the agent
const agent = createReactAgent({
    llm: llm,
    tools: [create_note],
    checkpointSaver: new MemorySaver(),
});

// Calls the agent
export async function callAgent(message: string, threadId: string): Promise<string> {
    try {
        // Call the agent with a message and thread ID
        const invokePromise = agent.invoke(
          {messages: [new HumanMessage(message)]}, 
          {configurable: { thread_id: threadId }},
        ) as Promise<{ messages: { content: string }[] }>;

        const timeoutPromise: Promise<never> = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Agent timeout")), 10000) // 10 segundos
        );
      
        // Promise.race puede devolver AgentFinalState o lanzar un Error
        const agentFinalState = await Promise.race([
            invokePromise,
            timeoutPromise,
        ]);
      
        // Log the agent final state
        console.log("Agent Final State:", agentFinalState);
      
        // Validate response
        if (agentFinalState.messages && agentFinalState.messages.length > 0) {
            // Return the content of the last message
            return agentFinalState.messages[agentFinalState.messages.length - 1].content;
        } else {
            throw new Error("No messages returned from agent.");
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error calling agent:", error.message);
            throw error;
        } else {
            console.error("Unknown error calling agent:", error);
            throw new Error("Unknown error calling agent");
        }
    }
}