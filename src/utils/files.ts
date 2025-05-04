import { TFile, Vault } from "obsidian";

// Returns a list of all files in the vault and their paths
// [{ name: "file1.md", path: "path/to/file1.md" }, ...]
export function getFiles(vault: Vault): { name: string, path: string }[] {
  return vault.getFiles().map((file: TFile) => ({
    name: file.name,
    path: file.path,
  }));
}

// Returns a list of all folders in the vault and their paths
// [{ name: "folder1", path: "path/to/folder1" }, ...]
export function getFolders(vault: Vault): { name: string, path: string }[] {
    return vault.getAllFolders().map((folder) => ({
        name: folder.name,
        path: folder.path,
    }));
}
