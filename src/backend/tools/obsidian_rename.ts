import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Notice } from 'obsidian';
import { getApp } from "src/plugin";
import { findClosestFile, findMatchingFolder } from 'src/utils/searching';
import { getNextAvailableFileName, getNextAvailableFolderName } from "src/utils/rename";

export const rename = tool(async (input) => {
    // Declaring app and inputs
    const app = getApp();
    let { newName, path, isNote } = input;

    if (isNote) {
        // Find the matching file path
        const matchedFile = findClosestFile(path);
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
            if (!matchedFile.parent) {
                const errorMsg = 'File has no parent directory';
                new Notice(errorMsg, 5000);
                throw new Error(errorMsg); 
            }
            newName = getNextAvailableFileName(newName, matchedFile.parent.path);
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
            const errorMsg = 'Error renaming file: ' + err;  
            new Notice(errorMsg, 5000);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error'
            };
        }
    } else {
        // Find the matching folder if the path is not absolute
        const matchingFolder = findMatchingFolder(path);
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
            newName = getNextAvailableFolderName(newName, parentDir);
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
            const errorMsg = 'Error renaming directory in Obsidian: ' + err;  
            new Notice(errorMsg, 5000);
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