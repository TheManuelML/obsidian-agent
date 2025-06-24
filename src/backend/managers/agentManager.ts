import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { LanguageModelLike } from "@langchain/core/language_models/base";
import { Runnable } from "@langchain/core/runnables";
import { AIMessageChunk } from "@langchain/core/messages";
import { TFile } from "obsidian";
import { getSettings } from "src/plugin";
import { createNote, editNote, readNote } from "src/backend/tools/obsidianFiles";
import { createDir, listFiles } from "src/backend/tools/obsidianDirs";
import { search } from "src/backend/tools/obsidianSearch";
import { MemoryManager } from "src/backend/managers/memoryManager";
import { ModelManager } from "src/backend/managers/modelManager";
import { imageToBase64 } from "src/utils/attachedImages";

// Types
type ContentType = Array<
    | {type: "text", text: string} // Text content
    | {type: "media", mimeType: string, data: string} // Image content
>
type MessageType = { 
    "role": "system" | "user", 
    "content": ContentType 
};
type InputType = { 
    "messages": MessageType[] 
}

// Agent class
export class Agent {
    private agent?: Runnable;
    private llm: LanguageModelLike = new ModelManager().getModel();
    private memory: MemorySaver = MemoryManager.getInstance().getMemorySaver();

    constructor() { 
        this.agent = this.createAgent();
    }

    private createAgent(): Runnable {
        return createReactAgent({
            llm: this.llm,
            checkpointSaver: this.memory,
            tools: [
                createNote,
                readNote,
                editNote,
                createDir,
                listFiles,
                search,
            ]
        });
    }

    // Calls the agent
    public async generateContent(
        systemMessage: string,
        humanMessage: string,
        notes: TFile[],
        images: File[],
        threadId: string,
        updateAiMessage: (chunk: string) => void
    ) {
        const agent = this.agent;
        if (!agent) throw new Error("Agent not initialized");
        
        const input = await this.getInputType(humanMessage, systemMessage, notes, images);
        const config = { "configurable": { "thread_id": threadId }, "streamMode": "messages" }

        // Generating response
        const response = await agent.stream(input, config);

        // Process and send the chunk
        for await (const chunk of response) {
            this.processChunk(chunk, updateAiMessage)
        }
    }

    // Prepare the input for the agent
    private async getInputType(
        humanMessage: string, 
        systemMessage: string, 
        notes: TFile[], 
        images: File[]
    ): Promise<InputType> {
        const settings = getSettings();

        let fullHumanMessage: string = humanMessage; 

        // Add the paths of the attached notes to the message
        if (notes && notes.length > 0) {
            fullHumanMessage += "\nConsider the following notes to answer the user request:\n"
            for (const note of notes) {
                fullHumanMessage += `- ${note.path}\n` 
            }
        }
        
        // Build the message
        let input: InputType;

        // Google and VertextAI do not support system messages in the input
        if (settings.provider === 'google') fullHumanMessage = `System prompt: ${systemMessage}\n\nUser message: ${fullHumanMessage}`;
        let humanContent: ContentType = [ {type: "text", text: fullHumanMessage} ]
        
        // Add attached images in Base64
        if (images && images.length > 0) {
            for (const img of images) {
                try {
                    const { mimeType, base64 } = await imageToBase64(img);
                    if (mimeType && base64) {
                        humanContent.push(
                            { type: "media", mimeType, data: base64 }
                        );
                    } else {
                        console.error('Image conversion failed for', img.name);
                    }
                } catch (e) {
                    console.error('Error converting image to base64:', e);
                }
            }
        }
        
        // Different input structure depending on the provider
        if (settings.provider === 'google') {   
            input = {
                messages: [
                    { "role": "user", "content": humanContent }
                ]
            };
        } else {
            input = {
                messages: [
                    { "role": "system", "content": [ {type: "text", text: systemMessage} ] },
                    { "role": "user", "content": humanContent }
                ]
            };
        }

        return input;
    }

    // Process agent response
    private processChunk(
        chunk: AIMessageChunk[], 
        updateAiMessage: (chunk: string) => void
    ) {
        for (const item of chunk) {
            if (item instanceof AIMessageChunk) {
                updateAiMessage(item.content.toString());
            }
        }
    }
}