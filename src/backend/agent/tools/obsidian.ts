import { tool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { TFile } from 'obsidian';
import { z } from 'zod';
import { llm } from "../agent";
import { getApp } from "src/plugin";

// Obsidian tool to write notes
export const create_note = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    let { topic, title, context, dir_path } = input; 

    console.log('Input:', input);

    // System prompt
    let sysPrompt: string = `You are a helpful assistant that write notes.`;
    // If needed are more rules to write the notes.

    if (context) {
        sysPrompt += ` Use the following context to write the note: ${context}`;
    }

    // Handle missing values
    if (!title) { title = 'Generated note' }
    if (!dir_path) { 
        dir_path = '/' 
    } else {
        // Ensure the directory path ends with a slash
        if (!dir_path.endsWith('/')) { dir_path += '/' }
    }

    // Declaring the note
    let note: {[key: string] : any} = {
        "title": title,
        "content": "",
        "dir_path": dir_path,
        "path": dir_path + title + '.md',
    };

    if (topic) {
        // Ask gemini to write a note about a topic
        const humanPrompt = `Write a note about ${topic}.`;
        try {
            const response = await llm.invoke([
                new SystemMessage(sysPrompt),
                new HumanMessage(humanPrompt),
            ]);

            note.content = response.content;
        } catch (error) {
            console.error('Error invoking LLM:', error);
            throw error;
        }
    }

    // Check if the note already exists
    try {
        let fileName = note.path;
        if (fileName.startsWith('/')) {
            fileName = fileName.substring(1);
        }

        // Function to find the next available file name
        const getNextAvailableFileName = (baseName: string) => {
            let number = 1;
            let newFileName = baseName.replace(/\.md$/, ` (${number}).md`);
            while (app.vault.getAbstractFileByPath(newFileName)) {
                number++;
                newFileName = baseName.replace(/\.md$/, ` (${number}).md`);
            }
            return newFileName;
        };

        // If the file already exists, find the next available name
        const existing = app.vault.getAbstractFileByPath(fileName);
        if (existing && existing instanceof TFile) {
            fileName = getNextAvailableFileName(fileName);  // Get the next available file name
        }

        // Write the note in Obsidian
        note.path = fileName;
        await app.vault.create(note.path, note.content);
        console.log(`Note created at: ${note.path}`);
    } catch (e) {
        console.error('Error creating file in Obsidian:', e);
        throw e;
    }

    return `Note created\nContent: ${note.content}\nTitle: ${note.title}\nDirectory: ${note.dir_path}`;
}, {
    // Tool schema and metadata
    name: 'write_note',
    description: 'Write a note in Obsidian. No parameters are needed.',
    schema: z.object({
        topic: z.string().optional().describe('The topic of the note, what is going to be written about'),
        title: z.string().optional().describe('The title, only use the one the user provides'),
        context: z.string().optional().describe('Context to use for the note'),
        dir_path: z.string().optional().describe('The path of the directory where the note is going to be stored'),
    })
})
