import { tool } from 'langchain';
import { z } from 'zod';
import { findClosestFile, findMatchingFolder } from "src/utils/notes/searching";

// Tool to search notes and folders
export const vaultSearch = tool(async (input: {
  name: string,
  isNote: boolean
}) => {
  // Declare input
  let { name, isNote } = input;

  if (isNote) {
    // Search for the note
    const matchedFile = findClosestFile(name);
    if (!matchedFile) {
      const errorMsg = `Could not find any note with the exact name or similar to "${name}".`;
      return { success: false, error: errorMsg };
    }

    // Return the note path
    return {
      success: true,
      type: "note",
      name: matchedFile.name,
      path: matchedFile.path
    };
  } else {
    // Search for the directory
    const matchedFolder = findMatchingFolder(name);
    if (!matchedFolder) {
      const errorMsg = `Could not find any directory with the name or similar to "${name}".`;
      return { success: false, error: errorMsg };
    }
        
    // Return the directory path
    return {
      success: true,
      type: "folder",
      name: matchedFolder.name,
      path: matchedFolder.path
    };
  }
}, {
  // Tool schema and metadata
  name: 'vault_search',
  description: 'Searches for notes and folders in Obsidian.',
  schema: z.object({
    name: z.string().describe('The exact or partial name to search for.'),
    isNote: z.boolean().default(true).describe('Whether is a file (True) or a folder (False)'),
  })
});
