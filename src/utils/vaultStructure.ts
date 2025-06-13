import { TFile, TFolder } from "obsidian";
import { getApp } from "src/plugin";

// Helper function to build the tree in a JSON format
export function getFolderStructure(folder: TFolder): any[] {
    return folder.children.map(child => {
        if (child instanceof TFolder) {
            return {
                type: 'folder',
                name: child.name,
                path: child.path,
                children: getFolderStructure(child)
            };
        } else if (child instanceof TFile) {
            return {
                type: 'file',
                name: child.name,
                path: child.path
            };
        }
    }); // return e.g: [{ type: 'folder', name: 'subfolder', path: 'path/to/subfolder', children: [...] }, { type: 'file', name: 'file.md', path: 'path/to/file.md' }, ...]
}

// Formats a JSON of folders to a string in form of a tree
export function formatFolderTree(tree: any[], depth = 0): string {
    let result = '';
    for (const node of tree) {
        const indent = '  '.repeat(depth);
        if (node.type === 'folder') {
            result += `${indent}- ${node.name}\n`;
            result += formatFolderTree(node.children, depth + 1);
        }
    }
    
    return result;
}

// Function that returns the root folder of the vault
export function getRootFolder(): TFolder {
    const app = getApp();
    const root = app.vault.getRoot();
  
    if (!(root instanceof TFolder)) {
      throw new Error("Root is not a TFolder");
    }
  
    return root;
}