import { tool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from 'zod';
import { getApp } from "../../plugin";
import { ModelManager } from '../managers/modelManager';
import { findClosestFile, findMatchingFolder } from '../../utils/searching';
import { getNextAvailableFileName } from "../../utils/rename";
import { formatTags } from '../../utils/formating';
import { getSamplePrompt } from '../../utils/llm';

// Obsidian tool to write notes
export const create_note = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    let { topic, name = 'Generated note', tags = [], context, dir_path = '/', content, useLLM = true } = input; 

    // Find the closest folder
    const matchedFolder = findMatchingFolder(dir_path);
    // Check if the folder exists
    if (!matchedFolder) {
        console.error(`Could not find any folder with the path "${dir_path}"`);
        return {
            success: false,
            error: `Could not find any folder with the path "${dir_path}"`
        };
    }

    // Sanitize the directory path
    dir_path = matchedFolder.path;
    // Adding extension to name
    name = name + '.md';
    // Full path with the directory path and the name of the file
    let full_path = dir_path + '/' + name;

    // Content generation
    if (!content) {
        if (topic && useLLM) {
            try {
                // Prompts
                let sysPrompt = getSamplePrompt('write');
                if (context) sysPrompt = `${sysPrompt}\nUse the following context to write the note: ${context}.`;
                
                const humanPrompt = `Please write a markdown note about ${topic}.` + (tags.length > 0 ? ` Add the following tags: ${tags.join(', ')}.` : '');
                
                // Initialize LLM
                const llm = ModelManager.getInstance().getModel();
                if (!llm) throw new Error("Failed to initialize LLM");

                // Invoke the LLM
                const response = await llm.invoke([
                    new SystemMessage(sysPrompt),
                    new HumanMessage(humanPrompt),
                ]);
                content = response.content.toString();
            
            } catch (err) {
                console.error('Error invoking LLM:', err);
                return {
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error'
                };
            }
        } else if (tags.length > 0) {
            content = formatTags(tags);
        } else {
            content = '';
        }
    }

    // Check if the note already exists
    if (app.vault.getAbstractFileByPath(full_path)) {
        // Append a number to the file name if it already exists
        name = getNextAvailableFileName(name, dir_path);
        full_path = dir_path + '/' + name;
    }

    try {
        // Write the note in Obsidian
        await app.vault.create(full_path, content);
    } catch (err) {
        console.error('Error creating file in Obsidian:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    return {
        success: true,
        usedLLM: !!topic && useLLM,
        name,
        tags,
        content,
        fullPath: full_path,
        parentDir: dir_path
    };
}, {
    // Tool schema and metadata
    name: 'create_note',
    description: 'Create a note. Content can be generated with a topic or provided manually.',
    schema: z.object({
        topic: z.string().optional().describe('The topic of the note, what is going to be written about'),
        name: z.string().optional().describe('The name the user provided'),
        tags: z.array(z.string()).optional().describe('The tags the user wants to add to the note'),
        context: z.string().optional().describe('Context the user provided to write the note'),
        dir_path: z.string().optional().describe('The path of the directory where the note is going to be stored'),
        content: z.string().optional().describe('Custom markdown content to use instead of generating'),
        useLLM: z.boolean().optional().default(true).describe('Whether to use the LLM to generate the content.')
    })
})


// Obsidian tool to update or write on existing notes
export const edit_note = tool(async (input) => {
    const app = getApp();
    let { fileName, newContent, useLLM = true, tags = [], context } = input;

    // Find the closest file
    const matchedFile = findClosestFile(fileName);
    
    // Check if the file exists
    if (!matchedFile) {
        const errorMsg = `Could not find any note with the name or similar to "${fileName}".`
        console.error(errorMsg);
        return {
            success: false,
            error: errorMsg,
        };
    }

    // Read the file
    let oldContent = await app.vault.read(matchedFile);
    let updatedContent = '';

    // If the user do not want to generate content replace directly
    if (!useLLM) {
        updatedContent = newContent || oldContent;
        if (tags.length > 0) {
            const formattedTags = formatTags(tags);
            updatedContent += `\n\n${formattedTags}`;
        }
    } else {
        try {
            const llm = ModelManager.getInstance().getModel();
            if (!llm) throw new Error("Failed to initialize LLM");

            let sysPrompt = getSamplePrompt('edit');
            if (context) {
                sysPrompt += `\nYou can use the following context while editing: ${context}`;
            }

            const humanPrompt = `Update the following markdown note:\n### NOTE ###\n${oldContent}\n### END NOTE ###\n` +
                `Apply the following update or topic: "${newContent}".\n` +
                (tags.length > 0 ? `Add or update with these tags: ${tags.join(', ')}.\n` : '') +
                `Return the full updated markdown note.`;

            const response = await llm.invoke([
                new SystemMessage(sysPrompt),
                new HumanMessage(humanPrompt),
            ]);

            updatedContent = response.content.toString();
        } catch (err) {
            console.error('Error invoking LLM:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error'
            };
        }
    }

    // Save the updated content
    try {
        await app.vault.modify(matchedFile, updatedContent);
    } catch (err) {
        console.error('Error updating file:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    return {
        success: true,
        usedLLM: useLLM,
        path: matchedFile.path,
        oldContent,
        newContent: updatedContent,
        tags,
    };
}, {
    name: 'update_note',
    description: 'Replaces or edits a note. Can use LLM or not, supports tags and context.',
    schema: z.object({
        fileName: z.string().describe('The name or path of the note to update'),
        newContent: z.string().optional().describe('New content or instructions to apply to the note'),
        useLLM: z.boolean().optional().default(true).describe('Whether to use the LLM to generate the updated note'),
        tags: z.array(z.string()).optional().describe('Tags to add or update in the note'),
        context: z.string().optional().describe('Additional context for the LLM to use when editing'),
    })
});


// Obsidian tool to read notes
export const read_note = tool(async (input) => {
    const app = getApp();
    const { fileName } = input;

    // Find the closest file
    const matchedFile = findClosestFile(fileName);
    
    // Check if the file exists
    if (!matchedFile) {
        console.error(`Could not find any note with the name or similar to "${fileName}".`);
        return {
            success: false,
            error: `Could not find any note similar to "${fileName}".`
        };
    }

    // Read the file
    try {
        const content = await app.vault.read(matchedFile);
        return {
            success: true,
            content: content,
            path: matchedFile.path
        };
    } catch (err) {
        console.error("Error reading file:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}, {
    // Tool schema and metadata
    name: 'read_note',
    description: 'Reads the content of a note in Obsidian, accepting full paths, partial names, or names with typos.',
    schema: z.object({
        fileName: z.string().describe('The name or path (can be fuzzy) of the note to read'),
    })
});