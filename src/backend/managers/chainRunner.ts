import { TFile } from "obsidian";
import { AIMessageChunk } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { Message } from "src/types";

// Class that contains the methods to run a chain
export class ChainRunner {
    // Run the chain using a streaming call
    async run(
        chain: Runnable,
        threadId: string, 
        message: Message, 
        notes: TFile[] | undefined,
        images: File[] | undefined, 
        updateAiMessage: (chunk: string) => void
    ) {
        const inputs = {
            messages: [{ role: "user", content: message.content }],
        };
        const config = {"configurable": {"thread_id": threadId}, "streamMode": "messages"}

        try {
            console.log("Starting stream...");
            const stream = await chain.stream(inputs, config);
            
            for await (const chunk of stream) {
                this.processChunk(chunk, updateAiMessage);
            }
        } catch (error) {
            console.error("Error de streaming:", error);
        }
    }

    // Run the chain using a multimodal streaming call
    async multimodalRun(
        chain: Runnable,
        threadId: string, 
        message: Message, 
        notes: TFile[] | undefined,
        images: File[] | undefined, 
        updateAiMessage: (chunk: string) => void
    ) {
        return;
    }

    // Process the chunk depending on the structure
    private processChunk(chunk: AIMessageChunk, updateAiMessage: (chunk: string) => void) {
        if (Array.isArray(chunk)) {
            this.processStandartChunk(chunk, updateAiMessage)
        } else {

        }
    }

    // Base chunk structure processing
    private processStandartChunk(chunk: AIMessageChunk[] | any[], updateAiMessage: (chunk: string) => void) {
        for (const item of chunk) {
            if (item instanceof AIMessageChunk) {
                updateAiMessage(item.content.toString());
            }
        }
    }
}