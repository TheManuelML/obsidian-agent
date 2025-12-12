import { Type } from "@google/genai";
import { getApp } from "src/plugin";
import { getNextAvailableFolderName } from 'src/utils/notes/renaming';

export const createDirFunctionDeclaration = ({
  name: "create_directory",
  description: "Create a directory in Obsidian. No parameters are needed.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The name of the directory",
        default: "New directory",
      },
      dirPath: {
        type: Type.STRING,
        description: "The path of the directory where is going to be placed",
        default: "",
      },
    },
    required: [],
  },
})

// Obsidian tool to create directories
export async function createDir(
  name: string,
  dirPath: string,
) {
  // Declaring the app and inputs
  const app = getApp();
  
  // Sanitize the path
  dirPath = dirPath.replace(/(\.\.\/|\/{2,})/g, '/').replace(/^\/+|\/+$/g, ''); // remove '..', double slashes, and leading and trailing slashes
  let fullPath = dirPath + '/' + name;
  if (!dirPath || dirPath === '/') fullPath = name;

  // Create the directory
  try {
    // Check if the directory already exists
    // Append a number to the name if it already exists
    if (app.vault.getFolderByPath(fullPath)) {
      const newName = getNextAvailableFolderName(name, dirPath);
        
      fullPath = dirPath + '/' + newName;
      if (!dirPath || dirPath === '/') fullPath = newName;
    }

    await app.vault.createFolder(fullPath);

    return {
      success: true,
      response: fullPath
    };
  } catch (err) {
    return { success: false, response: err instanceof Error ? err.message : 'Unknown error' };
  }
}