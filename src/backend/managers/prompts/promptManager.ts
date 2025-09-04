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

    formatPromptsForCompiledGraph(systemPrompt: string, userMessage: string, images?: string[]) {
        const unifiedPrompt = `
Instructions:
${systemPrompt}

User input:
${userMessage}`.trim();
        
        const inputs: { messages: Array<{"role": string, "content": string | Array<{"type": string, "text": string} | {"type": string, "image_url": {"url": string}}>}> } = { 
            messages: [
                {"role": "user", "content": [{"type": "text", "text": unifiedPrompt}]}
            ]
        };

        if (images && images.length > 0) {
            for (const img of images) {
                (inputs.messages[0].content as Array<any>).push({"type": "image_url", "image_url": { "url": img }});
            }
        } 
        
        return inputs
    }
}