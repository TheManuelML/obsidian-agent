import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getApp } from "../../plugin";
import { getNextAvailableFolderName } from '../../utils/rename';
import { findMatchingFolder } from '../../utils/searching'
import { getFolderStructure } from '../../utils/vaultStructure';

// Obsidian tool to create directories
export const create_dir = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    let { name = 'New Directory', dir_path = '/' } = input; 

    // Sanitize the path
    dir_path = dir_path.replace(/(\.\.\/|\/{2,})/g, '/').replace(/^\/+|\/+$/g, ''); // remove '..', double slashes, and leading and trailing slashes
    
    // Create the directory
    try {
        // Check if the directory already exists
        if (app.vault.getAbstractFileByPath(dir_path + '/' + name)) {
            // Append a number to the name if it already exists
            name = getNextAvailableFolderName(name, dir_path);
        }

        await app.vault.createFolder(dir_path + '/' + name);  

        return {
            success: true,
            directory: dir_path + name
        };
    } catch (err) {
        console.error('Error creating directory in Obsidian:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}, {
    // Tool schema and metadata
    name: 'create_directory',
    description: 'Create a directory in Obsidian. No parameters are needed.',
    schema: z.object({
        name: z.string().optional().describe('The name of the directory'),
        dir_path: z.string().optional().describe('The path of the directory where is going to be placed'),
    })
})


// List a tree of files and directories in a directory
export const list_files = tool(async (input) => {
    // Declaring the app and inputs
    let { dir_path = '/' } = input;

    // Find the matching folder if the path is not absolute    
    const matchingFolder = findMatchingFolder(dir_path);
    
    // Check if the directory exists
    if (!matchingFolder) {
        console.error('Directory not found:', dir_path);
        return {
            success: false,
            error: 'Directory not found'
        };
    }
    
    // Get the folder structure in a tree form
    try {
        const tree = {
            type: 'folder',
            name: matchingFolder.name,
            path: matchingFolder.path,
            children: getFolderStructure(matchingFolder)
        };

        return {
            success: true,
            tree
        };
    } catch (err) {
        console.error('Error listing files in Obsidian:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}, {
    // Tool schema and metadata
    name: 'list_files',
    description: 'List files and directories in a directory.',
    schema: z.object({
        dir_path: z.string().optional().describe('The path of the directory to list files from'),
    })
})