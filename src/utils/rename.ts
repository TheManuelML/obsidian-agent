import { App } from "obsidian";

// Append a number to a name if the file or the folder already exists
export function getNextAvailableFileName(base: string, app: App, parentPath: string): string {
    let i = 1;
    let newName = base;
    let fullPath = parentPath ? `${parentPath}/${newName}` : newName;

    while (app.vault.getAbstractFileByPath(fullPath)) {
        const extMatch = base.match(/\.[^/.]+$/);
        const nameWithoutExt = base.replace(/\.[^/.]+$/, ''); // Remove extension
        const ext = extMatch ? extMatch[0] : '';
        newName = `${nameWithoutExt} (${i++})${ext}`;
        fullPath = parentPath ? `${parentPath}/${newName}` : newName;
    }

    return newName; // e.g.: "file (1).md"
}

// Append a number to a folder name if the folder already exists
export function getNextAvailableFolderName(base: string, app: App, parentPath: string): string {
    let i = 1;
    let newName = base;
    let fullPath = parentPath ? `${parentPath}/${newName}` : newName;

    while (app.vault.getAbstractFileByPath(fullPath)) {
        newName = `${base} (${i++})`;
        fullPath = parentPath ? `${parentPath}/${newName}` : newName;
    }

    return newName; // return e.g: "folder (1)"
}