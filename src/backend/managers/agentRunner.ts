import { Notice, TFile } from "obsidian";
import { AIMessageChunk } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { PromptTemplateManager } from "src/backend/managers/prompts/promptManager";
import { Message } from "src/types";
import { getSettings } from "src/plugin";

// Class that contains the methods to run a agent
export class AgentRunner {
    private promptManager: PromptTemplateManager;

    constructor() {
        this.promptManager = new PromptTemplateManager();
    }

    // Run the agent using a streaming call
    async run(
        agent: Runnable,
        threadId: string, 
        message: Message, 
        notes: TFile[] | undefined,
        files: File[] | undefined, 
        updateAiMessage: (chunk: string, toolCalls?: any[]) => void
    ) {
        let fullMessage = message.content;
        let attachedImages: File[] = [];

        // If there are attached notes append the paths to the message
        if (notes && notes.length > 0) {
            fullMessage += `\n###\nTake into account the following Obsdian notes:`
            for (const note of notes) {
                const notePath = note.path;
                fullMessage += `\n${notePath}`;
            }
        }

        // Process attached images
        if (files && files.length > 0) {
            for (const f of files) {
                attachedImages.push(f);
            }
        }

        // Switch depending on the modality: (simple | multimodal)
        if (attachedImages && attachedImages.length > 0) {
            await this.multimodalRun(agent, threadId, fullMessage, attachedImages, updateAiMessage);
        } else {
            await this.simpleRun(agent, threadId, fullMessage, updateAiMessage);
        }
    }

    // Run the agent using a simple streaming call
    async simpleRun(agent: Runnable,
        threadId: string, 
        messageContent: string,
        updateAiMessage: (chunk: string, toolCalls?: any[]) => void
    ) {
        const settings = getSettings();
        const inputs = await this.promptManager.getSimplePromptTemplate('agent', messageContent);
        const config = {"configurable": {"thread_id": threadId}, "streamMode": "messages"}

        try {
            const stream = await agent.stream(inputs, config);
            
            for await (const chunk of stream) {
                this.processChunk(chunk, updateAiMessage);
            }
        } catch (err) {
            const errorMsg = "Simple streaming error: " + err;
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
        }
    }

    // Run the agent using a multimodal streaming call
    async multimodalRun(
        agent: Runnable,
        threadId: string, 
        messageContent: string,
        images: File[] | undefined, 
        updateAiMessage: (chunk: string, toolCalls?: any[]) => void
    ) {
        const settings = getSettings();
        const encodedImages: string[] = [];
        
        // Process images
        if (images && images.length > 0) {
            for (const img of images) {
                const encodedImage = await this.processAttachedImage(img);
                if (encodedImage) {
                    encodedImages.push(encodedImage);
                }
            }
        }

        const inputs = await this.promptManager.getMultimodalPromptTemplate('agent', messageContent, encodedImages);
        const config = {"configurable": {"thread_id": threadId}, "streamMode": "messages"}
        
        try {
            const stream = await agent.stream(inputs, config);
            
            for await (const chunk of stream) {
                this.processChunk(chunk, updateAiMessage);
            }
        } catch (err) {
            const errorMsg = "Multimodal streaming error: " + err;
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
        }
    }

    // Process the chunk depending on the structure
    private processChunk(chunk: AIMessageChunk | any, updateAiMessage: (chunk: string, toolCalls?: any[]) => void) {
        for (const item of chunk) {
            if (item instanceof AIMessageChunk) {
                const toolCalls = item.tool_calls;
                updateAiMessage(item.content.toString(), toolCalls);
            }
        }
    }

    // Encode image to base64
    private async processAttachedImage(image: File): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!image.type.startsWith("image/")) {
                console.error(`File is not an image: ${image.name}`);
                return resolve("");
            }
            
            const reader = new FileReader();
            reader.onload = () => {
              if (!reader.result) {
                console.error('Failed to read image file');
                return resolve("");
              }
              resolve(reader.result as string);
            };
            reader.onerror = () => {
                console.error(`Error reading image file: ${image.name}`)
                reject("");
            };
            reader.readAsDataURL(image);
        });
    }
}