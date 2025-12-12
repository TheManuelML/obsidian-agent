import { Type } from "@google/genai";
import { findMatchingFolder } from 'src/utils/notes/searching'
import { getFolderStructure } from 'src/utils/vault/vaultStructure';


export const listFilesFunctionDeclaration = {
  name: "list_files",
  description: "List files and directories of a directory.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      dirPath: {
        type: Type.STRING,
        description: "The path of the directory to list files from",
      },
      limit: {
        type: Type.INTEGER,
        description: "The maximum number of files and directories to list",
        default: 10,
      },
    },
    required: ["dirPath"],
  },
};

// List a tree of files and directories in a directory
export async function listFiles(
  dirPath: string, 
  limit: number,
) {
  // Find the matching folder if the path is not absolute    
  const matchingFolder = findMatchingFolder(dirPath);
  if (!matchingFolder) {
    return { success: false, response: `Directory ${dirPath} not found` };
  }

  // Get the folder structure in a tree form
  const tree = {
    type: 'folder',
    path: matchingFolder.path,
    childrens: getFolderStructure(matchingFolder, limit)
  };

  return {
    success: true,
    response: tree
  };
}
