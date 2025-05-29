import { App, TFile, TFolder, Vault } from "obsidian";
import levenshtein from "js-levenshtein";

// Returns a list of all folders in the vault and their paths
// [{ name: "folder1", path: "path/to/folder1" }, ...]
export function getFolders(vault: Vault): { name: string, path: string }[] {
    return vault.getAllFolders().map((folder) => ({
        name: folder.name,
        path: folder.path,
    })); // return e.g: [{ name: "folder1", path: "path/to/folder1" }, ...]
}

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


// Finds the closest file path to the target string using Levenshtein distance
export function findClosestFile(fileName: string, app: App): TFile | null {
    const exactMatch = app.vault.getFileByPath(fileName);
    if (exactMatch) return exactMatch;
    
    // Only if it does not finds an exact match it tries fuzzy match
    const allFiles = getFiles(app);
    const lowerFileName = fileName.toLowerCase();
    return allFiles.find(file => file.path.toLowerCase().includes(lowerFileName)) || null; // return e.g: TFile or null if no close match found
}

// Finds the closest folder path to the target string using Levenshtein distance
export function findMatchingFolder(dirName: string, app: App): TFolder | null {
    const exactMatch = app.vault.getFolderByPath(dirName);
    if (exactMatch) return exactMatch;

    // Only if it does not finds an exact match it tries fuzzy match
    const allFolders = app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder) as TFolder[];
    const lowerDir = dirName.toLowerCase();
    return allFolders.find(folder => folder.path.toLowerCase().includes(lowerDir)) || null; // return e.g: TFolder or null if no match found
}


// Helper function to build the tree in a JSON format
export function buildTree(folder: TFolder): any {
    const children = folder.children.map(child => {
        if (child instanceof TFolder) {
            return {
                type: 'folder',
                name: child.name,
                path: child.path,
                children: buildTree(child)
            };
        } else if (child instanceof TFile) {
            return {
                type: 'file',
                name: child.name,
                path: child.path
            };
        }
    });
    return children; // return e.g: [{ type: 'folder', name: 'subfolder', path: 'path/to/subfolder', children: [...] }, { type: 'file', name: 'file.md', path: 'path/to/file.md' }, ...]
}