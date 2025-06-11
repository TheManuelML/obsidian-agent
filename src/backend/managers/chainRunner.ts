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
        // If there are attached notes append the paths to the message
        if (notes && notes.length > 0) {
            message.content += `\n###\nTake into account the following files:`
            for (const note of notes) {
                const notePath = note.path;
                message.content += `\n${notePath}`;
            }
        }

        // Switch depending on the modality: (simple | multimodal)
        if (!images) {
            this.simpleRun(chain, threadId, message, updateAiMessage);
        } else {
            this.multimodalRun(chain, threadId, message, images, updateAiMessage)
        }
    }

    // Run the chain using a simple streaming call
    async simpleRun(chain: Runnable,
        threadId: string, 
        message: Message,
        updateAiMessage: (chunk: string) => void
    ) {
        const inputs = {
            messages: [{ role: "user", content: message.content }],
        };
        const config = {"configurable": {"thread_id": threadId}, "streamMode": "messages"}

        try {
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
        images: File[] | undefined, 
        updateAiMessage: (chunk: string) => void
    ) {
        // Define the type
        type ContentItem = | { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

        const inputs = { 
            messages: [{ 
                role: "user", 
                content: [{type: "text", text: message.content} as ContentItem]
            }]
        };

        // Append the images to the input
        if (images && images.length > 0) {
            for (const img of images) {
                const encodedImage = await this.processAttachedImage(img); // Execute encoder to base64
                if (encodedImage) {
                    inputs.messages[0].content.push({
                        type: "image_url", 
                        image_url: { url: encodedImage } 
                    });
                }
            }
        }

        const config = {"configurable": {"thread_id": threadId}, "streamMode": "messages"}

        try {
            const stream = await chain.stream(inputs, config);
            
            for await (const chunk of stream) {
                this.processChunk(chunk, updateAiMessage);
            }
        } catch (error) {
            console.error("Error de streaming:", error);
        }
    }

    // Process the chunk depending on the structure
    private processChunk(chunk: AIMessageChunk, updateAiMessage: (chunk: string) => void) {
        if (Array.isArray(chunk)) {
            this.processStandartChunk(chunk, updateAiMessage)
        } else {
            return;
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