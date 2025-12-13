import { Type } from '@google/genai';
import { getApp } from "src/plugin";
import { findMatchingFolder } from 'src/utils/notes/searching';
import { getNextAvailableFileName } from "src/utils/notes/renaming";
import { formatTags } from 'src/utils/notes/tags';
import { writingSystemPrompt } from 'src/backend/managers/prompts/library';
import { callModel } from 'src/backend/managers/modelRunner';


export const createNoteFunctionDeclaration = {
  name: "create_note",
  description: "Create a note. Content can be generated with a topic or provided manually. If no name provided a default one will be used.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
        description: 'The topic of the note, what is going to be written about',
        default: "",
      },
      name: {
        type: Type.STRING,
        description: 'The note name the user provided with markdown file extension .md',
        default: "Generated note.md",
      },
      tags: {
        type: Type.ARRAY,
        description: 'The tags the user wants to add to the note, do not make them up',
        items: { type: Type.STRING },
        default: [],
      },
      context: {
        type: Type.STRING,
        description: 'Context the user provided to write the note',
        default: "",
      },
      dirPath: {
        type: Type.STRING,
        description: 'The path of the directory where the note is going to be stored',
        default: "",
      },
      content: {
        type: Type.STRING,
        description: 'Custom markdown content to use instead of generating',
        default: "",
      },
      useLlm: {
        type: Type.BOOLEAN,
        description: 'Whether to use the LLM to generate the content.',
        default: true,
      },
    },
    required: [],
  }
}

// Obsidian tool to write notes
export async function createNote(
  topic: string,
  name: string,
  tags: string[],
  context: string,
  dirPath: string,
  content: string,
  useLlm: boolean,
) {
  const app = getApp();
  
  // Find the closest folder
  const matchedFolder = findMatchingFolder(dirPath);
  if (!matchedFolder) {
    return { success: false, response: `Could not find any directory with the path ${dirPath}` }
  }
  dirPath = matchedFolder.path;
  

  if (!name.endsWith('.md')) name += '.md'; 
  let fullPath = dirPath + '/' + name; // -> ParentPath/Name.md
  if (!dirPath || dirPath === '/') fullPath = name; // -> Name.md
  
  // Content generation
  if (!content) {
    if (topic && useLlm) {
      let sysPrompt = writingSystemPrompt;
      if (context) sysPrompt += `\nUse the following context to write the note: ${context}.`;

      const humanPrompt = `Write a note following this topic/instruction: ${topic}.`;
      
      try {
        const response = await callModel(sysPrompt, humanPrompt, []);
        content = response;

        if (tags.length > 0) content = formatTags(tags) + "\n" + content

      } catch (error) {
        return { success: false, response: String(error) };
      }
    } else if (tags.length > 0) {
      content = formatTags(tags);
    }
  }

  // Check if the note already exists
  // Append a number to the file name if it already exists
  if (app.vault.getAbstractFileByPath(fullPath)) {
    const newName = getNextAvailableFileName(name, dirPath);
    name = newName;

    fullPath = dirPath + '/' + name;
    if (!dirPath || dirPath === '/') fullPath = name; // -> Name.md
  }

  // Clean content
  content = content.trim();
  if (content.startsWith('\n')) content = content.slice(1);

  await app.vault.create(fullPath, content);
  return { 
    success: true,
    response: `Note created successfully at: ${fullPath}.`, 
  };
}
