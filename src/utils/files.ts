import { App, TFile, TFolder } from "obsidian";

// Auxiliary function to get all files in the vault
export function getFiles(app: App): TFile[] {
    const files: TFile[] = [];
    function traverse(folder: TFolder) {
        for (const child of folder.children) {
            if (child instanceof TFile) {
                files.push(child);
            } else if (child instanceof TFolder) {
                traverse(child);
            }
        }
    }
    traverse(app.vault.getRoot());
    return files; // reurn e.g: [TFile, TFile, ...]
}