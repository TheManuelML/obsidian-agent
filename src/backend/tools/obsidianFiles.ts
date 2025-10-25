import { tool } from 'langchain';
import { z } from 'zod';
import { Notice, TFile } from 'obsidian';
import { getApp, getSettings } from "src/plugin";
import { findClosestFile, findMatchingFolder } from 'src/utils/notes/searching';
import { getNextAvailableFileName } from "src/utils/notes/renaming";
import { formatTags } from 'src/utils/notes/tags';
import { removeImagesFromNote, extractImagesFromNote } from "src/utils/parsing/imageParse";
import { ModelManager } from 'src/backend/managers/modelManager';
import { writingSystemPrompt } from 'src/backend/managers/prompts/library';
import { callModel } from 'src/backend/managers/modelRunner';

// Obsidian tool to write notes
export const createNote = tool(async (input: {
  topic: string,
  name: string,
  tags: string[],
  context: string,
  dirPath: string,
  content: string,
  useLlm: boolean
}) => {
  const app = getApp();
  const settings = getSettings();
  let { topic, name, tags, context, dirPath, content, useLlm } = input; 

  // Find the closest folder
  const matchedFolder = findMatchingFolder(dirPath);
  if (!matchedFolder) {
    if (settings.debug) console.error(`Could not find any folder with the path "${dirPath}"`);
    dirPath = ""; // Set the root as the dir path  
  } else {
    dirPath = matchedFolder.path;
  }

  if (!name.endsWith('.md')) name += '.md'; 

  let fullPath = dirPath + '/' + name; // -> ParentPath/Name.md
  if (!dirPath || dirPath === '/') fullPath = name; // -> Name.md
  
  // Content generation
  if (!content) {
    if (topic && useLlm) {
      let sysPrompt = writingSystemPrompt;
      if (context) sysPrompt += `\nUse the following context to write the note: ${context}.`;

      const humanPrompt = `Write a note about: ${topic}.`;
      
      try {
        const response = await callModel(sysPrompt, humanPrompt, [], []);
        if (typeof response !== "string") throw new Error("Invalid response from LLM");
        content = response;

        if (tags.length > 0) content = formatTags(tags) + "\n" + content

      } catch (error) {
        const errorMsg = 'Error invoking LLM: ' + error;
        if (settings.debug) console.error(errorMsg);
        new Notice(errorMsg, 5000);
        
        return { success: false, error: errorMsg };
      }
    } else if (tags.length > 0) {
      content = formatTags(tags);
    }
  }

  // Check if the note already exists
  if (app.vault.getAbstractFileByPath(fullPath)) {
    // Append a number to the file name if it already exists
    const newName = getNextAvailableFileName(name, dirPath);
    name = newName;

    fullPath = dirPath + '/' + name;
    if (!dirPath || dirPath === '/') fullPath = name; // -> Name.md
  }

  console.log('Creating note at path:', fullPath);

  // Create the note
  await app.vault.create(fullPath, content);
  return { success: true, usedLlm: !!topic && useLlm, name, tags, content, fullPath, parentDir: dirPath };
}, {
  // Tool schema and metadata
  name: 'create_note',
  description: 'Create a note. Content can be generated with a topic or provided manually.',
  schema: z.object({
    topic: z.string().optional().default('').describe('The topic of the note, what is going to be written about'),
    name: z.string().optional().default('Generated note.md').describe('The note name the user provided with markdown file extension .md'),
    tags: z.array(z.string()).optional().default([]).describe('The tags the user wants to add to the note, do not make them up'),
    context: z.string().optional().default('').describe('Context the user provided to write the note'),
    dirPath: z.string().optional().default('').describe('The path of the directory where the note is going to be stored'),
    content: z.string().optional().default('').describe('Custom markdown content to use instead of generating'),
    useLlm: z.boolean().optional().default(true).describe('Whether to use the LLM to generate the content.')
  })
})


// Obsidian tool to update or write on existing notes
export const editNote = tool(async (input: {
  fileName: string,
  activeNote: boolean,
  newContent: string,
  useLlm: boolean,
  tags: string[],
  context: string,
}) => {
  const app = getApp();
  const settings = getSettings();
  const { fileName, activeNote, newContent, useLlm, tags, context } = input;
    
  let matchedFile: TFile | null;

  if (activeNote) {
    // Detect the current note
    matchedFile = app.workspace.getActiveFile()
    if (!matchedFile) {
      const errorMsg = "It seems like there is not an active note, and you haven't opened any recently."
      if (settings.debug) console.error(errorMsg);
      
      return { success: false, error: errorMsg}
    }
  } else if (fileName && !activeNote) {
    // Find the closest file
    matchedFile = findClosestFile(fileName);
    if (!matchedFile) {
      const errorMsg = `Could not find any note with the exact name or similar to "${fileName}".`
      if (settings.debug) console.error(errorMsg);
      
      return { success: false, error: errorMsg };
    }
  } else {
    const errorMsg = "No file name provided and 'active note' is not set as true.";
    if (settings.debug) console.error(errorMsg);
    
    return { success: false, error: errorMsg };
  }

  // Read the file
  let oldContent = await app.vault.read(matchedFile);
  let updatedContent = '';

  // If the user do not want to generate content replace directly
  if (!useLlm && (newContent || tags.length > 0)) {
    updatedContent = newContent || oldContent;
    if (tags.length > 0) updatedContent = formatTags(tags) + '\n' + updatedContent;

  } else if (useLlm) {
    const llm = ModelManager.getInstance().getModel();

    let sysPrompt = writingSystemPrompt;
    if (context) sysPrompt += `\nYou can use the following context to edit the note: ${context}`;

    const humanPrompt = `Update the following markdown note:\n###\n${oldContent}\n###` +
      (newContent ? `Apply the following update or topic: "${newContent}".\n`: '') +
      `Return the full updated markdown note.`;

    try {
      const response = await callModel(sysPrompt, humanPrompt, [], []);
      if (typeof response !== "string") throw new Error("Invalid response from LLM");
      updatedContent = response;

      if (tags.length > 0) updatedContent = formatTags(tags) + '\n' + updatedContent;

    } catch (error) {
      const errorMsg = 'Error invoking LLM: ' + error;  
      if (settings.debug) console.error(errorMsg);
      
      return { success: false, error: errorMsg };
    }
  } else {
    const errorMsg = 'No new content, tags, or topic provided to update the note.';  
    if (settings.debug) console.error(errorMsg);
    
    return { success: false, error: errorMsg };
  }

    // Save the updated content
  await app.vault.modify(matchedFile, updatedContent);
  
  return { success: true, useLlm, path: matchedFile.path, oldContent, newContent: updatedContent, tags };
}, {
  name: 'update_note',
  description: 'Write, replace and edit content of a note. Can use LLM or not, supports tags and context. Specify the note name or detect the active note if no name provided.',
  schema: z.object({
    fileName: z.string().optional().describe('The name or path of the note to edit. Without the markdown extension .md'),
    activeNote: z.boolean().default(false).optional().describe('If no filename provided set to true to read the active note'),
    newContent: z.string().optional().describe('New content or instructions to apply to the note'),
    useLlm: z.boolean().optional().default(true).describe('Whether to use the LLM to generate the updated note'),
    tags: z.array(z.string()).optional().default([]).describe('Tags to add or update in the note, do not make them up'),
    context: z.string().optional().default('').describe('Additional context for the LLM to use when editing'),
  })
});


// Obsidian tool to read notes
export const readNote = tool(async (input: {
  fileName: string,
  activeNote: boolean,
}) => {
  const app = getApp();
  const settings = getSettings();
  const { fileName, activeNote } = input;
  let matchedFile: TFile | null;

  if (!fileName && activeNote) {
    // Detect the current note
    matchedFile = app.workspace.getActiveFile()
    if (!matchedFile) {
      const errorMsg = "It seems like there is not an active note, and you haven't opened any recently."
      if (settings.debug) console.error(errorMsg);
      
      return { success: false, error: errorMsg }
    }
  
  } else if (fileName) {
    // Find the closest file
    matchedFile = findClosestFile(fileName);
    if (!matchedFile) {
      const errorMsg = `Could not find any note with the name or similar to "${fileName}".`;
      if (settings.debug) console.error(errorMsg);

      return { success: false, error: `Could not find any note similar to "${fileName}".`};
    }
  
  } else {
    const errorMsg = "No file name provided and 'active note' is not set as true.";
    if (settings.debug) console.error(errorMsg);
    
    return { success: false, error: errorMsg };
  }

  // Read the file
  let content = await app.vault.read(matchedFile);
  if (settings.readImages) {
    const images = await extractImagesFromNote(content);

    const sysPrompt = "Return a summary/description of the following images";
    const humanPrompt = "Here are the images.";
    const imageSummary = await callModel(sysPrompt, humanPrompt, [], images);
    if (typeof imageSummary !== "string") throw new Error("Invalid response from LLM");
    
    content = await removeImagesFromNote(content);
    content += `\n\n## Image Summary\n${imageSummary}\n`;
  } else {
    content = await removeImagesFromNote(content);
  }
        
  return { success: true, content: content, path: matchedFile.path };
}, {
  // Tool schema and metadata
  name: 'read_note',
  description: 'Reads the content of a note in Obsidian by name or by detecting the currently active note. The content itself is not needed as input.',
  schema: z.object({
    fileName: z.string().optional().describe('The name or path of the note to read'),
    activeNote: z.boolean().default(false).optional().describe('If no filename provided set to true to read the active note') 
  })
});