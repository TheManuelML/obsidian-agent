import { App, TFile, TFolder, Vault } from "obsidian";
import levenshtein from "js-levenshtein";

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

// Auxiliary function to get all files in the vault
export function getAllFiles(app: App): TFile[] {
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
  return files;
}

// Finds the closest file path to the target string using Levenshtein distance
export function findClosestFile(target: string, files: TFile[]): TFile | null {
  const normalizedTarget = target.toLowerCase();
  let bestMatch: TFile | null = null;
  let minDistance = Infinity;

  for (const file of files) {
      const pathDist = levenshtein(normalizedTarget, file.path.toLowerCase());
      const nameDist = levenshtein(normalizedTarget, file.name.toLowerCase());

      const dist = Math.min(pathDist, nameDist);
      if (dist < minDistance) {
          minDistance = dist;
          bestMatch = file;
      }

      // Prioridad: coincidencia exacta por nombre
      if (file.name.toLowerCase() === normalizedTarget || file.path.toLowerCase() === normalizedTarget) {
          return file;
      }
  }

  return minDistance <= 10 ? bestMatch : null;
}