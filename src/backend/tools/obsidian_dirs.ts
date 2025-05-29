import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getApp } from "../../plugin";
import { sanitizePath } from '../../utils/sanitize';
import { getNextAvailableFolderName, buildTree, findMatchingFolder } from '../../utils/files';
import { TFolder } from 'obsidian';

// Obsidian tool to create directories
export const create_dir = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    let { name = 'New Directory', dir_path = '/' } = input; 

    // Sanitize the path
    dir_path = sanitizePath(dir_path);
    
    // Create the directory
    try {
        // Check if the directory already exists
        if (app.vault.getAbstractFileByPath(dir_path + '/' + name)) {
            // Append a number to the name if it already exists
            name = getNextAvailableFolderName(name, app, dir_path);
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
    const app = getApp();
    let { dir_path = '/' } = input;

    const matchingFolder = findMatchingFolder(dir_path, app);
    dir_path = matchingFolder ? matchingFolder.path : dir_path;

    // Sanitize the path
    dir_path = sanitizePath(dir_path);

    // Check if the directory exists
    const root = app.vault.getAbstractFileByPath(dir_path);
    if (!root || !(root instanceof TFolder)) {
        console.error('Directory not found:', dir_path);
        return {
            success: false,
            error: 'Directory not found'
        };
    }
    
    try {
        const tree = {
            type: 'folder',
            name: root.name,
            path: root.path,
            children: buildTree(root)
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


// Rename a dirctory
export const rename_dir = tool(async (input) => {
    const app = getApp();
    let { dir_path, new_name } = input;

    // Find the matching folder if the path is not absolute
    const matchingFolder = findMatchingFolder(dir_path, app);
    dir_path = matchingFolder ? matchingFolder.path : dir_path;

    // Sanitize the path
    dir_path = sanitizePath(dir_path).replace(/\/$/, ''); // Remove trailing slash if present

    // Check if the directory exists
    const root = app.vault.getAbstractFileByPath(dir_path);
    if (!root || !(root instanceof TFolder)) {
        console.error('Directory not found:', dir_path);
        return {
            success: false,
            error: 'Directory not found'
        };
    }

    // Validate the new name, if it already exists, append a number to it
    const parentDir = root.path.split('/').slice(0, -1).join('/');
    let newPath = parentDir ? `${parentDir}/${new_name}` : new_name;

    if (app.vault.getAbstractFileByPath(newPath)) {
        new_name = getNextAvailableFolderName(new_name, app, parentDir);
        newPath = parentDir ? `${parentDir}/${new_name}` : new_name;
    }

    // Rename the directory
    try {
        await app.vault.rename(root, newPath);
        
        return {
            success: true,
            old_directory: root.path,
            new_directory: newPath
        };
    } catch (err) {
        console.error('Error renaming directory in Obsidian:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}, {
    // Tool schema and metadata
    name: 'rename_directory',
    description: 'Rename a directory in Obsidian.',
    schema: z.object({
        dir_path: z.string().describe('The path or name of the directory where it is located'),
        new_name: z.string().describe('The new name for the directory'),
    })
})