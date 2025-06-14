import mammoth from "mammoth";
import { Notice, TFile } from "obsidian";
import { AIMessageChunk } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { PromptTemplateManager } from "src/backend/managers/prompts/promptManager";
import { Message } from "src/types";
import { getSettings } from "src/plugin";

// Class that contains the methods to run a chain
export class ChainRunner {
    private promptManager: PromptTemplateManager;

    constructor() {
        this.promptManager = new PromptTemplateManager();
    }

    // Run the chain using a streaming call
    async run(
        chain: Runnable,
        threadId: string, 
        message: Message, 
        notes: TFile[] | undefined,
        files: File[] | undefined, 
        updateAiMessage: (chunk: string) => void
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

        // Process files
        if (files && files.length > 0) {
            for (const f of files) {
                if (f.type.startsWith("image/")) {
                    attachedImages.push(f);
                } else {
                    const content = await this.extractTextFromFile(f);
                    fullMessage += `\n###\nAttached file name: ${f.name}\nContent: ${content}`
                }
            }
        }

        // Switch depending on the modality: (simple | multimodal)
        if (attachedImages && attachedImages.length > 0) {
            await this.multimodalRun(chain, threadId, fullMessage, attachedImages, updateAiMessage);
        } else {
            await this.simpleRun(chain, threadId, fullMessage, updateAiMessage);
        }
    }

    // Run the chain using a simple streaming call
    async simpleRun(chain: Runnable,
        threadId: string, 
        messageContent: string,
        updateAiMessage: (chunk: string) => void
    ) {
        const settings = getSettings();
        const inputs = await this.promptManager.getSimplePromptTemplate('agent', messageContent);
        const config = {"configurable": {"thread_id": threadId}, "streamMode": "messages"}

        try {
            const stream = await chain.stream(inputs, config);
            
            for await (const chunk of stream) {
                this.processChunk(chunk, updateAiMessage);
            }
        } catch (err) {
            const errorMsg = "Streaming error: " + err;
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
        }
    }

    // Run the chain using a multimodal streaming call
    async multimodalRun(
        chain: Runnable,
        threadId: string, 
        messageContent: string,
        images: File[] | undefined, 
        updateAiMessage: (chunk: string) => void
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
            const stream = await chain.stream(inputs, config);
            
            for await (const chunk of stream) {
                this.processChunk(chunk, updateAiMessage);
            }
        } catch (err) {
            const errorMsg = "Streaming error: " + err;
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
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

    // Return text from binary files (método actualizado)
    async extractTextFromFile(file: File): Promise<string> {
        const settings = getSettings();
        try {
            const ext = file.name.split(".").pop()?.toLowerCase();
            if (!ext) throw new Error("Archivo sin extensión");

            const arrayBuffer = await file.arrayBuffer();
            
            if (ext === "docx") {
                const buffer = Buffer.from(arrayBuffer);
                const result = await mammoth.extractRawText({ buffer });
                return result.value;
            }

            throw new Error("Formato no soportado: solo DOCX");
        } catch (err: any) {
            const errorMsg = `Error procesando archivo ${file.name}: ${err.message}`;
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
            return `[Error: No se pudo procesar el archivo ${file.name}]`;
        }   
    }
}