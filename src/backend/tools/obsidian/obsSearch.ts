import { Type } from '@google/genai';
import { findClosestFile, findMatchingFolder } from "src/utils/notes/searching";


export const vaultSearchFunctionDeclaration = {
  name: "vault_search",
  description: "Searches for notes and folders in Obsidian's user vault.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The path or name to search for.",
      },
      isNote: {
        type: Type.BOOLEAN,
        description: "Whether is a note (True) or a folder (False)",
        default: true,
      },
    },
    required: [name],
  },
};

// Search notes or folders in the vault with their name or path
export async function vaultSearch(
  name: string, 
  isNote: boolean,
) {
  if (isNote) {
    // Search for the note
    const matchedFile = findClosestFile(name);
    if (!matchedFile) {
      const errorMsg = `Could not find any note with the exact name or similar to "${name}".`;
      return { success: false, response: errorMsg };
    }

    // Return the note path
    return {
      success: true,
      response: { 
        type: "note",
        path: matchedFile.path,
      },
    };
  } else {
    // Search for the directory
    const matchedFolder = findMatchingFolder(name);
    if (!matchedFolder) {
      const errorMsg = `Could not find any directory with the name or similar to "${name}".`;
      return { success: false, response: errorMsg };
    }
        
    // Return the directory path
    return {
      success: true,
      response: { 
        type: "folder",
        path: matchedFolder.path,
      },
    };
  }
};
