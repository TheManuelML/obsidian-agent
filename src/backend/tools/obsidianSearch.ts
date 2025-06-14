import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { findClosestFile, findMatchingFolder } from "src/utils/searching";

// Tool to search notes and folders
export const search = tool(async (input) => {
    // Declare input
    let { name, isNote } = input;

    if (isNote) {
        // Search for the note
        const matchedFile = findClosestFile(name);
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
            type: "note",
            name: matchedFile.name,
            path: matchedFile.path
        };
    } else {
        // Search for the directory
        const matchedFolder = findMatchingFolder(name);
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
            type: "folder",
            name: matchedFolder.name,
            path: matchedFolder.path
        };
    }
}, {
    // Tool schema and metadata
    name: 'search',
    description: 'Searches for notes and folders in Obsidian.',
    schema: z.object({
        name: z.string().describe('The name or part of the name to search for.'),
        isNote: z.boolean().describe('Whether is a file (True) or a folder (False)'),
    })
});