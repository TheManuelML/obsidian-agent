import { App, TFile, TFolder } from "obsidian";

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


// Finds the closest file path to the target
export function findClosestFile(fileName: string, app: App): TFile | null {
    const exactMatch = app.vault.getFileByPath(fileName);
    if (exactMatch) return exactMatch;
    
    // Only if it does not finds an exact match it tries fuzzy match
    const allFiles = getFiles(app);
    const lowerFileName = fileName.toLowerCase();
    return allFiles.find(file => file.path.toLowerCase().includes(lowerFileName)) || null; // return e.g: TFile or null if no close match found
}

// Finds the closest folder path to the target
export function findMatchingFolder(dirName: string, app: App): TFolder | null {
    const exactMatch = app.vault.getFolderByPath(dirName);
    if (exactMatch) return exactMatch;

    // Only if it does not finds an exact match it tries fuzzy match
    const allFolders = app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder) as TFolder[];
    const lowerDir = dirName.toLowerCase();
    return allFolders.find(folder => folder.path.toLowerCase().includes(lowerDir)) || null; // return e.g: TFolder or null if no match found
}


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


// Extract content form attached files to adapt them to the Agent
export async function processFiles(files: File[]): Promise<Array<{ name: string; type: string; content: string }>> {
    const results: Array<{ name: string; type: string; content: string }> = [];
  
    const processFile = (file: File): Promise<{ name: string; type: string; content: string }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
  
        if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          reader.readAsText(file);
          reader.onload = () => {
            if (!reader.result) {
              reject(new Error('Failed to read file'));
              return;
            }
            resolve({ name: file.name, type: file.type, content: reader.result as string });
          };
          reader.onerror = () => reject(new Error(`Error reading text file: ${file.name}`));
        }
  
        else if (file.type.startsWith("image/")) {
          reader.readAsDataURL(file);  // base64
          reader.onload = () => {
            if (!reader.result) {
              reject(new Error('Failed to read image file'));
              return;
            }
            resolve({ name: file.name, type: file.type, content: reader.result as string });
          };
          reader.onerror = () => reject(new Error(`Error reading image file: ${file.name}`));
        }
  
        else {
          resolve({ name: file.name, type: file.type, content: "[Unsupported file type]" });
        }
      });
    };
  
    for (const file of files) {
      try {
        const result = await processFile(file);
        results.push(result);
      } catch (e) {
        console.error(`Error processing file ${file.name}:`, e);
        results.push({ 
          name: file.name, 
          type: file.type, 
          content: `[Error: ${e instanceof Error ? e.message : 'Unknown error'}]` 
        });
      }
    }
  
    return results;
}