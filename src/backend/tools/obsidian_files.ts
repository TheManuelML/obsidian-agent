import { tool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from 'zod';
import { getLLM } from "../agent";
import { getApp, getPlugin } from "../../plugin";
import { getAllFiles, findClosestFile, findMatchingFolder } from "../../utils/files";


function sanitizePath(path: string): string {
    return path.replace(/(\.\.\/|\/{2,})/g, '/').replace(/\/+$/, '') + '/';
}

function formatTags(tags: string[]): string {
    return `---\ntags:\n- ${tags.join('\n- ')}\n---\n`;
}

// Obsidian tool to write notes
export const create_note = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    const plugin = getPlugin();
    let { topic, title = 'Generated note', tags = [], context, dir_path = '/' } = input; 

    console.log('Input:', input);

    // Sanitize the path
    dir_path = sanitizePath(dir_path);
    // Find the closest folder
    const matchedFolder = findMatchingFolder(dir_path, app);
    dir_path = sanitizePath(matchedFolder ? matchedFolder.path : '/');

    // Declaring the note
    let note: { [key: string] : any } = {
        title,
        tags,
        content: "",
        dir_path,
        path: dir_path + title + '.md',
    };

    // System prompt
    let sysPrompt: string = `You are a helpful assistant that writes notes in Obsidian. Follow this rules that Obsidian has:
    - The note must be written in markdown format.
    - Link other files using [[FILE_PATH]]
    - If tags are required, add them at the beginning of the note this way:
        ---
        tags:
        - tag1
        - tag2
        - ...
        ---
    - Just return the content of the note.
    - DO NOT write the markdown inside a code snippet.`; // If needed are more rules to write the notes.
    if (context) {
        sysPrompt += `\nUse the following context to write the note: ${context}`;
    }


    // Content generation
    try {
        if (topic) {
            const model = plugin?.settings?.model ?? 'gemini-1.5-flash';
            const apiKey = plugin?.settings?.apiKey ?? '';
            let humanPrompt = `Please write a markdown note about ${topic}.` + (tags.length > 0 ? ` Add the following tags: ${tags.join(', ')}.` : '');
            const response = await getLLM(model, apiKey).invoke([
                new SystemMessage(sysPrompt),
                new HumanMessage(humanPrompt),
            ]);
            note.content = response.content;
        } else if (tags.length > 0) {
            note.content = formatTags(tags);
        }
    } catch (err) {
        console.error('Error invoking LLM:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    // Check if the note already exists
    try {
        let filePath = note.path.startsWith('/') ? note.path.slice(1) : note.path;

        // Function to find the next available file name
        const getNextAvailableFileName = (base: string) => {
            let i = 1;
            let newName = base.replace(/\.md$/, ` (${i}).md`);
            while (app.vault.getAbstractFileByPath(newName)) {
                newName = base.replace(/\.md$/, ` (${++i}).md`);
            }
            return newName;
        };

        if (app.vault.getAbstractFileByPath(filePath)) {
            filePath = getNextAvailableFileName(filePath);
        }

        // Write the note in Obsidian
        note.path = filePath;
        await app.vault.create(note.path, note.content);
        console.log(`Note created at: ${note.path}`);
    } catch (err) {
        console.error('Error creating file in Obsidian:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    return {
        success: true,
        title: note.title,
        tags: note.tags,
        content: note.content,
        path: note.path,
        directory: note.dir_path
    };    
}, {
    // Tool schema and metadata
    name: 'write_note',
    description: 'Write a note in Obsidian. No parameters are needed.',
    schema: z.object({
        topic: z.string().optional().describe('The topic of the note, what is going to be written about'),
        title: z.string().optional().describe('The title the user provided'),
        tags: z.array(z.string()).optional().describe('The tags the user wants to add to the note'),
        context: z.string().optional().describe('Context the user provided to write the note'),
        dir_path: z.string().optional().describe('The path of the directory where the note is going to be stored'),
    })
})


// Obsidian tool to read notes
export const read_note = tool(async (input) => {
    const app = getApp();
    const { fileName } = input;

    const files = getAllFiles(app);
    const matchedFile = findClosestFile(fileName, files);

    if (!matchedFile) {
        return {
            success: false,
            error: `Could not find any note similar to "${fileName}".`
        };
    }

    try {
        const content = await app.vault.read(matchedFile);
        return {
            success: true,
            content: content,
            path: matchedFile.path
        };
    } catch (err) {
        console.error("Error reading file:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}, {
    // Tool schema and metadata
    name: 'read_note',
    description: 'Reads the content of a note in Obsidian, accepting full paths, partial names, or names with typos.',
    schema: z.object({
        fileName: z.string().describe('The name or path (can be fuzzy) of the note to read'),
    })
});


// Obsidian tool to update or write on existing notes
export const update_note = tool(async ({ fileName, section, newContent }) => {
    const app = getApp();
    const plugin = getPlugin();
    const file = findClosestFile(fileName, getAllFiles(app));
    if (!file) throw new Error(`Note not found: ${fileName}`);
  
    let text = await app.vault.read(file);
    let newNoteContent = '';

    // Content generation
    let humanPrompt = `Please update the content of the following note: \n### NOTE ###\n${text}\n### END NOTE ###\nUse this topic or specific content to update the note: ${newContent}.\nRETURN THE COMPLETE NOTE WITH THE UPDATED CONTENT.`;
    let sysPrompt = `You are a helpful assistant that writes notes in Obsidian. Follow this rules that Obsidian has:
    - The note must be written in markdown format.
    - Link other files using [[FILE_PATH]]
    - If tags are required, add them at the beginning of the note this way:
        ---
        tags:
        - tag1
        - tag2
        - ...
        ---
    - Just return the content of the note.
    - DO NOT write the markdown inside a code snippet.`;

    if (section) {
        humanPrompt += `\nSearch for the section: ${section}. The new content should be written ONLY on that section. Keep the rest of the note as it is.`;
    } else {
        humanPrompt += `\nWrite the new content on the whole note.`;
    }
    
    try {
        if (newContent) {
            const model = plugin?.settings?.model ?? 'gemini-2.0-flash';
            const apiKey = plugin?.settings?.apiKey ?? '';

            const response = await getLLM(model, apiKey).invoke([
                new SystemMessage(sysPrompt),
                new HumanMessage(humanPrompt),
            ]);
            newNoteContent = response.content.toString();
        }
    } catch (err) {
        console.error('Error invoking LLM:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
  
    // Update the note
    try {
        await app.vault.modify(file, newNoteContent);
    } catch (err) {
        console.error('Error updating file:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
  
    return { 
        success: true, 
        path: file.path,
        newContent: newNoteContent,
    };
}, {
    name: 'update_note',
    description: 'Replaces the content of a note. Can be used to update a specific section or the whole note.',
    schema: z.object({
      fileName: z.string().describe('The name or path of the note to update'),
      section: z.string().optional().describe('The specific section to update. Can be a header, paragraph, topic to be searched on the note.'),
      newContent: z.string().describe('The new content to replace the section with. Also can be a topic to write the new content about.'),
    })
});

