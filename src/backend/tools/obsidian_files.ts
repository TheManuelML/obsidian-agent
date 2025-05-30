//TODO: Add option to link files in create_note and update_note
//TODO: Add the option to empty a file in update note

import { tool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from 'zod';
import { getLLM } from "../agent";
import { getApp, getPlugin } from "../../plugin";
import { findClosestFile, findMatchingFolder, getNextAvailableFileName } from "../../utils/files";
import { sanitizePath, formatTags } from '../../utils/sanitize';
import { getSamplePrompt, appendContentToPrompt } from '../../utils/samplePrompts';

// Obsidian tool to write notes
export const create_note = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    const plugin = getPlugin();
    let { topic, name = 'Generated note', tags = [], context, dir_path = '/' } = input; 

    // Find the closest folder
    const matchedFolder = findMatchingFolder(dir_path, app);
    // Check if the folder exists
    if (!matchedFolder) {
        console.error(`Could not find any folder with the path "${dir_path}"`);
        return {
            success: false,
            error: `Could not find any folder with the path "${dir_path}"`
        };
    }

    // Sanitize the directory path
    dir_path = sanitizePath(matchedFolder.path);

    // Adding extension to name
    name = name + '.md';
    // Full path with the directory path and the name of the file
    let full_path = dir_path + '/' + name;

    // Content generation
    let content: any = '';
    try {
        if (topic) {
            const model = plugin?.settings?.model ?? 'gemini-1.5-flash';
            const apiKey = plugin?.settings?.apiKey ?? '';
            
            // System prompt
            let sysPrompt = getSamplePrompt('write');
            if (context) {
                sysPrompt = appendContentToPrompt(sysPrompt, `\nUse the following context to write the note: ${context}`);
            }
            let humanPrompt = `Please write a markdown note about ${topic}.` + (tags.length > 0 ? ` Add the following tags: ${tags.join(', ')}.` : '');
            
            const response = await getLLM(model, apiKey).invoke([
                new SystemMessage(sysPrompt),
                new HumanMessage(humanPrompt),
            ]);
            content = response.content;

        } else if (tags.length > 0) {
            content = formatTags(tags);
        }
    } catch (err) {
        console.error('Error invoking LLM:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    // Check if the note already exists
    try {
        if (app.vault.getAbstractFileByPath(full_path)) {
            // Append a number to the file name if it already exists
            name = getNextAvailableFileName(name, app, dir_path);
            full_path = dir_path + '/' + name;
        }

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
        name: name,
        tags: tags,
        content: content,
        fullPath: full_path,
        parentDir: dir_path
    };
}, {
    // Tool schema and metadata
    name: 'create_note',
    description: 'Write a note in Obsidian. No parameters are needed.',
    schema: z.object({
        topic: z.string().optional().describe('The topic of the note, what is going to be written about'),
        name: z.string().optional().describe('The name the user provided'),
        tags: z.array(z.string()).optional().describe('The tags the user wants to add to the note'),
        context: z.string().optional().describe('Context the user provided to write the note'),
        dir_path: z.string().optional().describe('The path of the directory where the note is going to be stored'),
    })
})


// Obsidian tool to read notes
export const read_note = tool(async (input) => {
    const app = getApp();
    const { fileName } = input;

    // Find the closest file
    const matchedFile = findClosestFile(fileName, app);
    
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


// Obsidian tool to update or write on existing notes
export const edit_note = tool(async (input) => {
    const app = getApp();
    const plugin = getPlugin();
    let { fileName, section, newContent } = input;

    // Find the closest file
    const matchedFile = findClosestFile(fileName, app);
    
    // Check if the file exists
    if (!matchedFile) {
        console.error(`Could not find any note with the name or similar to "${fileName}".`);
        return {
            success: false,
            error: `Could not find any note with the name or similar to "${fileName}".`
        };
    }

    // Read the file
    let text = await app.vault.read(matchedFile);
    let newNoteContent = '';

    // Configure the prompts
    let humanPrompt = `Please update the content of the following note: \n### NOTE ###\n${text}\n### END NOTE ###\nUse this topic or specific content to update the note: ${newContent}.\nRETURN THE COMPLETE NOTE WITH THE UPDATED CONTENT.`;
    let sysPrompt = getSamplePrompt('write');
    if (section) {
        sysPrompt = appendContentToPrompt(sysPrompt, `\nSearch for the section: ${section}. The new content should be written ONLY on that section. Keep the rest of the note as it is.`);
    }

    // Content generation
    try {
        if (newContent) {
            const model = plugin?.settings?.model ?? 'gemini-2.0-flash';
            const apiKey = plugin?.settings?.apiKey ?? '';

            const response = await getLLM(model, apiKey).invoke([
                new SystemMessage(sysPrompt),
                new HumanMessage(humanPrompt),
            ]);
            newNoteContent = response.content.toString();
        }
    } catch (err) {
        console.error('Error invoking LLM:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
  
    // Update the note
    try {
        await app.vault.modify(matchedFile, newNoteContent);
    } catch (err) {
        console.error('Error updating file:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
  
    return {
        success: true, 
        path: matchedFile.path,
        oldContent: text,
        newContent: newNoteContent,
    };
}, {
    // Tool schema and metadata
    name: 'update_note',
    description: 'Replaces the content of a note. Can be used to update a specific section or the whole note.',
    schema: z.object({
      fileName: z.string().describe('The name or path of the note to update'),
      section: z.string().optional().describe('The specific section to update. Can be a header, paragraph, topic to be searched on the note.'),
      newContent: z.string().describe('The new content to replace the section with. Also can be a topic to write the new content about.'),
    })
});

