import { App, TFile, TFolder, Vault } from "obsidian";
import levenshtein from "js-levenshtein";

// Returns a list of all folders in the vault and their paths
// [{ name: "folder1", path: "path/to/folder1" }, ...]
export function getFolders(vault: Vault): { name: string, path: string }[] {
    return vault.getAllFolders().map((folder) => ({
        name: folder.name,
        path: folder.path,
    }));
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
  return files;
}


// Append a number to a name if the file or the folder already exists
export function getNextAvailableFileName(base: string, app: App) {
    let i = 1;
    let newName = base.replace(/\.md$/, ` (${i}).md`);
    while (app.vault.getAbstractFileByPath(newName)) {
        newName = base.replace(/\.md$/, ` (${++i}).md`);
    }
    return newName;
};


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

// Finds the closest folder path to the target string using Levenshtein distance
export function findMatchingFolder(dirInput: string, app: App): TFolder | null {
    const allFolders = app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder) as TFolder[];
    const lowerDir = dirInput.toLowerCase();
    return allFolders.find(folder => folder.path.toLowerCase().includes(lowerDir)) || null;
}