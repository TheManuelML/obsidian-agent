import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getApp } from "../../plugin";
import { findClosestFile, findMatchingFolder } from "../../utils/searching";

// Tool to search for a note in Obsidian
export const search_note = tool(async (input) => {
    // Declare app and input
    const app = getApp();
    let { name } = input;

    // Search for the note
    const matchedFile = findClosestFile(name, app);
    if (!matchedFile) {
        console.error(`Could not find any note with the name or similar to "${name}".`);
        return {
            success: false,
            error: `Could not find any note with the name or similar to "${name}".`
        };
    }
    
    // Return the note path
    return {
        success: true,
        name: matchedFile.name,
        filePath: matchedFile.path
    };
}, {
    // Tool schema and metadata
    name: 'search_note',
    description: 'Searches for notes in Obsidian.',
    schema: z.object({
        name: z.string().describe('The name or part of the name of the note to search for.'),
    })
});


// Tool to search for a directory in Obsidian
export const search_dir = tool(async (input) => {
    // Declare app and input
    const app = getApp();
    let { name } = input;

    // Search for the directory
    const matchedFolder = findMatchingFolder(name, app);
    if (!matchedFolder) {
        console.error(`Could not find any directory with the name or similar to "${name}".`);
        return {
            success: false,
            error: `Could not find any directory with the name or similar to "${name}".`
        };
    }

    // Return the directory path
    return {
        success: true,
        name: matchedFolder.name,
        dirPath: matchedFolder.path
    };
}, {
    // Tool schema and metadata
    name: 'search_dir',
    description: 'Searches for directories in Obsidian.',
    schema: z.object({
        name: z.string().describe('The name or part of the name of the directory to search for.'),
    })
});