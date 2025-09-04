import { promptLibrary } from "src/backend/managers/prompts/library";
import { TFolder } from "obsidian";
import { getFolderStructure, formatFolderTree, getRootFolder } from "src/utils/vaultStructure";

export class PromptTemplateManager {
    async getSimplePromptTemplate(situation: 'write' | 'agent', userMessage: string) {
        const systemPrompt = promptLibrary[situation];

        if (situation === 'agent') {
            // Get the root folder structure
            const rootFolder: TFolder = getRootFolder();
            const folderStructure: string = formatFolderTree(getFolderStructure(rootFolder));

            const systemPromptWithStructure = systemPrompt.replace("{folderStructure}", folderStructure);

            return this.formatPromptsForCompiledGraph(systemPromptWithStructure, userMessage);
        } else {
            return this.formatPromptsForCompiledGraph(systemPrompt, userMessage);   
        };
    }

    async getMultimodalPromptTemplate(situation: 'write' | 'agent', userMessage: string, images: string[]) {
        const systemPrompt = promptLibrary[situation];

        if (situation === 'agent') {
            // Get the root folder structure
            const rootFolder: TFolder = getRootFolder();
            const folderStructure: string = formatFolderTree(getFolderStructure(rootFolder));

            const systemPromptWithStructure = systemPrompt.replace("{folderStructure}", folderStructure);
            
            return this.formatPromptsForCompiledGraph(systemPromptWithStructure, userMessage, images);
        } else {        
            return this.formatPromptsForCompiledGraph(systemPrompt, userMessage, images)
        };
    }

    formatPromptsForCompiledGraph(
        systemPrompt: string, 
        userMessage: string, 
        images?: string[]
    ) {
        const unifiedPrompt = `
Instructions:
${systemPrompt}

User input:
${userMessage}`.trim();
        
        // Private types to avoid any typing
        type TextContent = {"type": "text", "text": string};
        type ImageContent = {"type": "image_url", "image_url": {"url": string}};
        type MessageContent = TextContent | ImageContent;

        interface ChatMessage {
            role: "user" | "assistant" | "system";
            content: string | MessageContent[];
        }

        const inputs: { messages: ChatMessage[] } = { 
            messages: [
                {"role": "user", "content": [{"type": "text", "text": unifiedPrompt}]}
            ],
        };

        if (images && images.length > 0) {
            const content = inputs.messages[0].content;
            if (Array.isArray(content)) {
                for (const img of images) {
                    content.push({ type: "image_url", image_url: { "url": img } });
                }
            }
        }
        return inputs;
    }
}