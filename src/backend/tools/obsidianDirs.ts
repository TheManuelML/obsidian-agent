import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Notice } from 'obsidian';
import { getApp, getSettings } from "src/plugin";
import { getNextAvailableFolderName } from 'src/utils/notes/renaming';
import { findMatchingFolder } from 'src/utils/notes/searching'
import { getFolderStructure } from 'src/utils/vault/vaultStructure';

// Obsidian tool to create directories
export const createDir = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    const settings = getSettings();
    let { name = 'New directory', dirPath = '' } = input;

    // Sanitize the path
    dirPath = dirPath.replace(/(\.\.\/|\/{2,})/g, '/').replace(/^\/+|\/+$/g, ''); // remove '..', double slashes, and leading and trailing slashes
    let fullPath = dirPath + '/' + name;
    if (!dirPath || dirPath === '/') fullPath = name;

    // Create the directory
    try {
        // Check if the directory already exists
        if (app.vault.getFolderByPath(fullPath)) {
            // Append a number to the name if it already exists
            const newName = getNextAvailableFolderName(name, dirPath);
            
            fullPath = dirPath + '/' + newName;
            if (!dirPath || dirPath === '/') fullPath = newName;
        }

        await app.vault.createFolder(fullPath);

        return {
            success: true,
            directory: fullPath
        };
    } catch (err) {
        const errorMsg = 'Error creating directory in Obsidian: ' + err;
        new Notice(errorMsg, 5000);
        if (settings.debug) console.error(errorMsg);
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
        dirPath: z.string().optional().describe('The path of the directory where is going to be placed'),
    })
})


// List a tree of files and directories in a directory
export const listFiles = tool(async (input) => {
    // Declaring the app and inputs
    const settings = getSettings();
    let { dirPath = '/' } = input;

    // Find the matching folder if the path is not absolute    
    const matchingFolder = findMatchingFolder(dirPath);

    // Check if the directory exists
    if (!matchingFolder) {
        console.error('Directory not found:', dirPath);
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
        const errorMsg = 'Error listing files in Obsidian: ' + err;
        new Notice(errorMsg, 5000);
        if (settings.debug) console.error(errorMsg);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}, {
    // Tool schema and metadata
    name: 'list_files',
    description: 'List files and directories of a directory.',
    schema: z.object({
        dirPath: z.string().optional().describe('The path of the directory to list files from'),
    })
})