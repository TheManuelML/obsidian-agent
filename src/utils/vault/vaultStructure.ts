import { TFile, TFolder } from "obsidian";

// Type used in the folder structure functions
export type FolderNode =
  | {
      type: "folder";
      name: string;
      path: string;
      children: FolderNode[];
    }
  | {
      type: "file";
      name: string;
      path: string;
    };

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