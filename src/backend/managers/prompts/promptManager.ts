import { ChatPromptValue } from "@langchain/core/prompt_values";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { promptLibrary } from "src/backend/managers/prompts/library";
import { TFolder } from "obsidian";
import { getRootFolder } from "src/plugin";
import { getFolderStructure, formatFolderTree } from "src/utils/vaultStructure";

export class PromptTemplateManager {
    async getOptimalPromptTemplate(situation: 'write' | 'agent' | 'llm', userMessage: string): Promise<ChatPromptValue> {
        let promptValue;
        const systemPrompt = promptLibrary[situation];

        if (situation === 'agent') {
            // Get the root folder structure
            const rootFolder: TFolder = getRootFolder();
            const folderStructure: string = formatFolderTree(getFolderStructure(rootFolder));

            const systemPromptWithStructure = systemPrompt.replace("{folderStructure}", folderStructure);

            // Create a new template with folderStructure variable
            const agentTemplate = ChatPromptTemplate.fromMessages([
                ["system", systemPromptWithStructure],
                ["user", "{text}"],
            ]);

            promptValue = await agentTemplate.invoke({
                text: userMessage,            
            });
        } else {
            const promptTemplate = ChatPromptTemplate.fromMessages([
                ["system", systemPrompt],
                ["user", "{text}"],
            ]);
    
            promptValue = await promptTemplate.invoke({
                text: userMessage
            });
        }

        return promptValue;
    }

    async getMultimodalPromptTemplate(situation: 'write' | 'agent' | 'llm', userMessage: string, images: string[]): Promise<ChatPromptValue> {
        let promptValue;
        const systemPrompt = promptLibrary[situation];

        if (situation === 'agent') {
            // Get the root folder structure
            const rootFolder: TFolder = getRootFolder();
            const folderStructure: string = formatFolderTree(getFolderStructure(rootFolder));

            const systemPromptWithStructure = systemPrompt.replace("{folderStructure}", folderStructure);

            // Create a new template with folderStructure variable
            const agentTemplate = ChatPromptTemplate.fromMessages([
                ["system", systemPromptWithStructure],
                ["user", "{text}"],
            ]);

            promptValue = await agentTemplate.invoke({
                text: userMessage,
                images,
            });    
        } else {        
            const promptTemplate = ChatPromptTemplate.fromMessages([
                ["system", systemPrompt],
                ["user", "{text}"],
            ]);
    
            promptValue = await promptTemplate.invoke({
                text: userMessage,
                images: images,
            });
        }

        return promptValue;
    }
}