import { TFile, TFolder } from "obsidian";
import { getApp } from "src/plugin";

// Finds the closest file path to the target
export function findClosestFile(fileName: string): TFile | null {
    const app = getApp();
    const exactMatch = app.vault.getFileByPath(fileName);
    if (exactMatch) return exactMatch;
    
    // Only if it does not finds an exact match it tries fuzzy match
    const allFiles = app.vault.getFiles();
    const lowerFileName = fileName.toLowerCase();
    return allFiles.find(file => file.path.toLowerCase().includes(lowerFileName)) || null; // return e.g: TFile or null if no close match found
}

// Finds the closest folder path to the target
export function findMatchingFolder(dirName: string): TFolder | null {
    const app = getApp();
    const exactMatch = app.vault.getFolderByPath(dirName);
    if (exactMatch) return exactMatch;

    // Only if it does not finds an exact match it tries fuzzy match
    const allFolders = app.vault.getAllLoadedFiles().filter((f): f is TFolder => f instanceof TFolder);
    const lowerDir = dirName.toLowerCase();
    return allFolders.find(folder => folder.path.toLowerCase().includes(lowerDir)) || null; // return e.g: TFolder or null if no match found
}