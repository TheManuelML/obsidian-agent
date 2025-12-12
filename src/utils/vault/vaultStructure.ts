import { TFile, TFolder } from "obsidian";

// Type used in the folder structure functions
export type FolderNode = {
  type: "folder";
  path: string;
  children: FolderNode[];
} | {
  type: "file";
  path: string;
};

// Helper function to build the tree in a JSON format
export function getFolderStructure(folder: TFolder, limit: number): FolderNode[] {
  return folder.children.map((child): FolderNode | undefined => {
    if (child instanceof TFolder) {
      return {
        type: 'folder',
        path: child.path,
        children: getFolderStructure(child, limit)
      };
    } else if (child instanceof TFile) {
      return {
        type: 'file',
        path: child.path
      };
    }
    return undefined;
  }).filter((node): node is FolderNode => node !== undefined).slice(0, limit);
}