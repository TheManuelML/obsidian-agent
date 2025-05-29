import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getApp } from "../../plugin";
import { findClosestFile, findMatchingFolder, getNextAvailableFileName, getNextAvailableFolderName } from "../../utils/files";
import { sanitizePath } from '../../utils/sanitize';

// Obsidian tool to rename a file
export const rename_note = tool(async (input) => {
    // Declaring app and inputs
    const app = getApp();
    let { newName, filePath } = input;

    // Find the matching file path
    const matchedFile = findClosestFile(filePath, app);
    
    // Check if the file exists
    if (!matchedFile) {
        console.error(`Could not find any note with the name or similar to "${filePath}".`);
        return {
            success: false,
            error: `Could not find any note with the name or similar to "${filePath}".`
        };
    }

    // Check if the new name already exists
    if (app.vault.getAbstractFileByPath(newName)) {
        if (!matchedFile.parent) { throw new Error('File has no parent directory') }
        newName = getNextAvailableFileName(newName, app, matchedFile.parent.path);
    }

    // Rename the file
    try {
        await app.vault.rename(matchedFile, newName);
        return {
            success: true,
            oldPath: matchedFile.path,
            newPath: matchedFile.parent ? `${matchedFile.parent.path}/${newName}` : newName
        };
    } catch (err) {
        console.error('Error renaming file:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}, {
    // Tool schema and metadata
    name: 'rename_note',    
    description: 'Renames a note in Obsidian.',
    schema: z.object({  
        newName: z.string().describe('The new name for the note'),
        filePath: z.string().describe('The path of the note to rename. Can be a full path or a name.'),
    })
})


// Rename a dirctory
export const rename_dir = tool(async (input) => {
    const app = getApp();
    let { dir_path = '/', new_name } = input;

    // Find the matching folder if the path is not absolute
    const matchingFolder = findMatchingFolder(dir_path, app);

    // Check if the directory exists
    if (!matchingFolder) {
        console.error('Directory not found:', dir_path);
        return {
            success: false,
            error: 'Directory not found'
        };
    }

    // Sanitize the path
    dir_path = sanitizePath(matchingFolder.path).replace(/\/$/, ''); // Remove trailing slash if present

    // Validate the new name, if it already exists, append a number to it
    const parentDir = dir_path.split('/').slice(0, -1).join('/');
    let newPath = parentDir ? `${parentDir}/${new_name}` : new_name;

    if (app.vault.getAbstractFileByPath(newPath)) {
        new_name = getNextAvailableFolderName(new_name, app, parentDir);
        newPath = parentDir ? `${parentDir}/${new_name}` : new_name;
    }

    // Rename the directory
    try {
        await app.vault.rename(matchingFolder, newPath);
        
        return {
            success: true,
            old_directory: dir_path,
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