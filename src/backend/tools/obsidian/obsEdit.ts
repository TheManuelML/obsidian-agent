import { Type } from "@google/genai";
import { ChangeObject } from "diff";
import { App, TFile } from 'obsidian';
import { getApp, getSettings } from "src/plugin";
import { findClosestFile } from 'src/utils/notes/searching';
import { formatTags } from 'src/utils/notes/tags';
import { writingSystemPrompt } from 'src/backend/managers/prompts/library';
import { callModel } from 'src/backend/managers/modelRunner';
import { DiffReviewModal } from "src/feature/modals/DiffReviewModal";


export const editNoteFunctionDeclaration = {
  name: "edit_note",
  description: "Write, replace and edit content of a note. Can use LLM or not, supports tags and context. Specify the note name or detect the active note if no name provided.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fileName: {
        type: Type.STRING,
        description: "The name or path of the note to edit. Without the markdown extension .md",
        default: "",
      },
      activeNote: {
        type: Type.BOOLEAN,
        description: "If no filename provided set to true to read the active note",
        default: false,
      },
      newContent: {
        type: Type.STRING,
        description: "New content or instructions to apply to the note",
      },
      useLlm: {
        type: Type.BOOLEAN,
        description: "Whether to use the LLM to generate content for the note",
        default: true,
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Tags to add in the note, do not make them up",
        default: [],
      },
      context: {
        type: Type.STRING,
        description: "Additional context for the LLM to use when editing",
        default: "",
      },
    },
    required: ["newContent"],
  },
}

// Obsidian tool to update or write on existing notes
export async function editNote(
  fileName: string = "",
  activeNote: boolean = false,
  newContent: string,
  useLlm: boolean = true,
  tags: string[] = [],
  context: string = "",
) {
  const app = getApp();
  const settings = getSettings();
    
  let matchedFile: TFile | null;

  if (activeNote) {
    // Detect the current note
    matchedFile = app.workspace.getActiveFile()
    if (!matchedFile) {
      const errorMsg = "It seems like there is not an active note, and you haven't opened any recently."
      if (settings.debug) console.error(errorMsg);
      
      return { success: false, response: errorMsg}
    }
  } else if (fileName && !activeNote) {
    // Find the closest file
    matchedFile = findClosestFile(fileName);
    if (!matchedFile) {
      const errorMsg = `Could not find any note with the exact name or similar to "${fileName}".`
      if (settings.debug) console.error(errorMsg);
      
      return { success: false, response: errorMsg };
    }
  } else {
    const errorMsg = "No file name provided and 'active note' is not set as true.";
    if (settings.debug) console.error(errorMsg);
    
    return { success: false, response: errorMsg };
  }

  // Read the file
  let oldContent = await app.vault.read(matchedFile);
  let updatedContent = '';

  // If the user do not want to generate content replace directly
  if (!useLlm && (newContent || tags.length > 0)) {
    updatedContent = newContent || oldContent;
    if (tags.length > 0) updatedContent = formatTags(tags) + '\n' + updatedContent;

  } else if (useLlm) {
    let sysPrompt = writingSystemPrompt;
    if (context) sysPrompt += `\nYou can use the following context to edit the note: ${context}`;

    const humanPrompt = `Update the following markdown note:\n###\n${oldContent}\n###` +
      (newContent ? `Apply the following update or topic: "${newContent}".\n`: '') +
      `Return the full updated markdown note. Do not remove any existing content unless specified (including links and paths).`;

    try {
      const response = await callModel(sysPrompt, humanPrompt, []);
      if (typeof response !== "string") throw new Error("Invalid response from LLM");
      updatedContent = response;

      if (tags.length > 0) updatedContent = formatTags(tags) + '\n' + updatedContent;

    } catch (error) {
      const errorMsg = 'Error invoking LLM: ' + error;  
      if (settings.debug) console.error(errorMsg);
      
      return { success: false, response: errorMsg };
    }
  } else {
    const errorMsg = 'No new content, tags, or topic provided to update the note.';  
    if (settings.debug) console.error(errorMsg);
    
    return { success: false, response: errorMsg };
  }

  // Clean updated content
  updatedContent = updatedContent.trim();
  if (updatedContent.startsWith("\n")) {
    // Remove the leading new line
    updatedContent = updatedContent.slice(1);
  }

  const { finalContent, finalDiff } = await initReview(app, oldContent, updatedContent);

  // Save the updated content
  await app.vault.modify(matchedFile, finalContent);

  return { 
    success: true, 
    response: {
      diff: finalDiff, 
      tags,
    }
  };
}


async function initReview(
  app: App,
  oldContent: string,
  newContent: string,
): Promise<{ finalContent: string, finalDiff: ChangeObject<string>[] }> {
  
  return new Promise<{ finalContent: string, finalDiff: ChangeObject<string>[] }>((resolve) => {
    const modal = new DiffReviewModal(
      app,
      (finalContent: string, finalDiff: ChangeObject<string>[]) => {
        resolve({ finalContent, finalDiff });
      },
      (finalContent: string, finalDiff: ChangeObject<string>[]) => { 
        resolve({ finalContent, finalDiff }) 
      },
      oldContent,
      newContent
    );
    modal.open();
  });
}