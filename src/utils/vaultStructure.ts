import { TFile, TFolder } from "obsidian";
import { FolderNode } from "src/types";
import { getApp } from "src/plugin";

// Helper function to build the tree in a JSON format
export function getFolderStructure(folder: TFolder): FolderNode[] {
    return folder.children.map((child): FolderNode | undefined => {
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
        return undefined;
    }) // return e.g: [{ type: 'folder', name: 'subfolder', path: 'path/to/subfolder', children: [...] }, { type: 'file', name: 'file.md', path: 'path/to/file.md' }, ...]
    .filter((node): node is FolderNode => node !== undefined);
}

// Formats a JSON of folders to a string in form of a tree
export function formatFolderTree(tree: FolderNode[], depth = 0): string {
    let result = '';
    for (const node of tree) {
        const indent = '  '.repeat(depth);
        if (node.type === 'folder') {
            result += `${indent}- ${node.name}\n`;
            result += formatFolderTree(node.children, depth + 1);
        } else {
            result += `${indent}- ${node.name}\n`;
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