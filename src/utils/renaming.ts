import { getApp } from "src/plugin";

// Append a number to a name if the file or the folder already exists
export function getNextAvailableFileName(base: string, parentPath: string): string {
    const app = getApp();

    const extMatch = base.match(/\.[^/.]+$/);
    const ext = extMatch ? extMatch[0] : '';
    const nameWithoutExt = ext ? base.slice(0, -ext.length) : base;
    
    // Check if the name already has a numbered suffix like " (1)", " (2)", etc.
    const numberedSuffixMatch = nameWithoutExt.match(/^(.+) \((\d+)\)$/);
    const baseName = numberedSuffixMatch ? numberedSuffixMatch[1] : nameWithoutExt;
    const startingNumber = numberedSuffixMatch ? parseInt(numberedSuffixMatch[2]) + 1 : 1;

    let i = startingNumber;
    let newName: string;
    let fullPath: string;

    // Helper function to construct proper path
    const constructPath = (filename: string) => {
        if (parentPath === '/' || parentPath === '') {
            return filename;
        }
        return `${parentPath.replace(/\/$/, '')}/${filename}`;
    };

    // First, check if the original base name is available
    newName = `${baseName}${ext}`;
    fullPath = constructPath(newName);
    
    // If original name is available, return it
    if (!app.vault.getAbstractFileByPath(fullPath)) {
        return newName;
    }

    // If not available, start appending numbers
    do {
        newName = `${baseName} (${i})${ext}`;
        fullPath = constructPath(newName);
        i++;
    } while (app.vault.getAbstractFileByPath(fullPath));

    return newName;
}

// Append a number to a folder name if the folder already exists
export function getNextAvailableFolderName(base: string, parentPath: string): string {
    const app = getApp();
    
    // Check if the name already has a numbered suffix like " (1)", " (2)", etc.
    const numberedSuffixMatch = base.match(/^(.+) \((\d+)\)$/);
    const baseName = numberedSuffixMatch ? numberedSuffixMatch[1] : base;
    const startingNumber = numberedSuffixMatch ? parseInt(numberedSuffixMatch[2]) + 1 : 1;

    let i = startingNumber;
    let newName: string;
    let fullPath: string;

    // Helper function to construct proper path
    const constructPath = (folderName: string) => {
        if (parentPath === '/' || parentPath === '') {
            return folderName;
        }
        return `${parentPath.replace(/\/$/, '')}/${folderName}`;
    };

    // First, check if the original base name is available
    newName = baseName;
    fullPath = constructPath(newName);
    
    // If original name is available, return it
    if (!app.vault.getAbstractFileByPath(fullPath)) {
        return newName;
    }

    // If not available, start appending numbers
    do {
        newName = `${baseName} (${i})`;
        fullPath = constructPath(newName);
        i++;
    } while (app.vault.getAbstractFileByPath(fullPath));

    return newName;
}