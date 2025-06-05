import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getApp } from "../../plugin";
import { findClosestFile, findMatchingFolder } from '../../utils/searching';
import { getNextAvailableFileName, getNextAvailableFolderName } from "../../utils/rename";

export const rename = tool(async (input) => {
    // Declaring app and inputs
    const app = getApp();
    let { newName, path, isNote } = input;

    if (isNote) {
        // Find the matching file path
        const matchedFile = findClosestFile(path, app);
        // Check if the file exists
        if (!matchedFile) {
            console.error(`Could not find any note with the name or similar to "${path}".`);
            return {
                success: false,
                error: `Could not find any note with the name or similar to "${path}".`
            };
        }

        // Check if the new name already exists
        if (app.vault.getAbstractFileByPath(newName)) {
            if (!matchedFile.parent) throw new Error('File has no parent directory') 
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
    } else {
        // Find the matching folder if the path is not absolute
        const matchingFolder = findMatchingFolder(path, app);
        // Check if the directory exists
        if (!matchingFolder) {
            console.error('Directory not found:', path);
            return {
                success: false,
                error: 'Directory not found'
            };
        }
        
        // Get the parent directory path
        let parentDir = matchingFolder.parent?.path;
        if (!parentDir) parentDir = '';
        // Build the new path
        let newPath = `${parentDir}/${newName}`;

        // Get a new folder name if the name you choos already exists
        if (app.vault.getFolderByPath(matchingFolder.path)) {
            newName = getNextAvailableFolderName(newName, app, parentDir);
            newPath = parentDir ? `${parentDir}/${newName}` : newName;
        }

        // Rename the directory
        try {
            await app.vault.rename(matchingFolder, newPath);
            
            return {
                success: true,
                oldFolder: path,
                newFolder: newPath
            };
        } catch (err) {
            console.error('Error renaming directory in Obsidian:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error'
            };
        }
    }
}, {
    // Tool schema and metadata
    name: "rename",
    description: "Rename notes and folders in Obsidian",
    schema: z.object({
        newName: z.string().describe("The new name of the note or the folder"),
        path: z.string().describe("The path to the note or to the folder"),
        isNote: z.boolean().describe("Whether is a note (True) or a folder (False)")
    })
});