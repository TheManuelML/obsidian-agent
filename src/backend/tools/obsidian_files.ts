import { tool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from 'zod';
import { getApp, getPlugin } from "../../plugin";
import { getLLM } from "../agent";
import { findClosestFile, findMatchingFolder } from '../../utils/searching';
import { getNextAvailableFileName } from "../../utils/rename";
import { sanitizePath, formatTags } from '../../utils/formating';
import { getSamplePrompt, getApiKey } from '../../utils/llm';

// Obsidian tool to write notes
export const create_note = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    const plugin = getPlugin();
    let language = plugin.settings.language;
    let { topic, name = 'Generated note', tags = [], context, dir_path = '/', content, useLLM = true } = input; 

    // Find the closest folder
    const matchedFolder = findMatchingFolder(dir_path, app);
    // Check if the folder exists
    if (!matchedFolder) {
        console.error(`Could not find any folder with the path "${dir_path}"`);
        return {
            success: false,
            error: `Could not find any folder with the path "${dir_path}"`
        };
    }

    // Sanitize the directory path
    dir_path = sanitizePath(matchedFolder.path);
    // Adding extension to name
    name = name + '.md';
    // Full path with the directory path and the name of the file
    let full_path = dir_path + '/' + name;

    // Content generation
    if (!content) {
        if (topic && useLLM) {
            try {
                const provider = plugin.settings.provider;
                const model = plugin.settings.model;
            
                // Choose the apiKey depending on the provider
                let apiKey: string = getApiKey(provider);

                // Prompts
                let sysPrompt = getSamplePrompt('write', language);
                if (context) {
                    if (language === 'es') {
                        sysPrompt += `\nUsa el siguiente contexto para escribir la nota: ${context}.`
                    } else if (language === 'en') {
                        sysPrompt += `\nUse the following context to write the note: ${context}.`;
                    }
                }
                
                const humanPrompt = language == 'es' 
                    ? `Por favor, escribe una nota en markdown sobre ${topic}.` + (tags.length > 0 ? ` Añade las siguientes etiquetas: ${tags.join(', ')}.` : '')
                    : `Please write a markdown note about ${topic}.` + (tags.length > 0 ? ` Add the following tags: ${tags.join(', ')}.` : '');
                
                // Initialize LLM
                const llm = getLLM(provider, model, apiKey);
                if (!llm) throw new Error("Failed to initialize LLM");

                // Invoke the LLM
                const response = await llm.invoke([
                    new SystemMessage(sysPrompt),
                    new HumanMessage(humanPrompt),
                ]);
                content = response.content.toString();
            
            } catch (err) {
                console.error('Error invoking LLM:', err);
                return {
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error'
                };
            }
        } else if (tags.length > 0) {
            content = formatTags(tags);
        } else {
            content = '';
        }
    }

    // Check if the note already exists
    if (app.vault.getAbstractFileByPath(full_path)) {
        // Append a number to the file name if it already exists
        name = getNextAvailableFileName(name, app, dir_path);
        full_path = dir_path + '/' + name;
    }

    try {
        // Write the note in Obsidian
        await app.vault.create(full_path, content);
    } catch (err) {
        console.error('Error creating file in Obsidian:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    return {
        success: true,
        usedLLM: !!topic && useLLM,
        name,
        tags,
        content,
        fullPath: full_path,
        parentDir: dir_path
    };
}, {
    // Tool schema and metadata
    name: 'create_note',
    description: 'Create a note. Content can be generated with a topic or provided manually.',
    schema: z.object({
        topic: z.string().optional().describe('The topic of the note, what is going to be written about'),
        name: z.string().optional().describe('The name the user provided'),
        tags: z.array(z.string()).optional().describe('The tags the user wants to add to the note'),
        context: z.string().optional().describe('Context the user provided to write the note'),
        dir_path: z.string().optional().describe('The path of the directory where the note is going to be stored'),
        content: z.string().optional().describe('Custom markdown content to use instead of generating'),
        useLLM: z.boolean().optional().default(true).describe('Whether to use the LLM to generate the content.')
    })
})


// Obsidian tool to read notes
export const read_note = tool(async (input) => {
    const app = getApp();
    const { fileName } = input;

    // Find the closest file
    const matchedFile = findClosestFile(fileName, app);
    
    // Check if the file exists
    if (!matchedFile) {
        console.error(`Could not find any note with the name or similar to "${fileName}".`);
        return {
            success: false,
            error: `Could not find any note similar to "${fileName}".`
        };
    }

    // Read the file
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
export const edit_note = tool(async (input) => {
    const app = getApp();
    const plugin = getPlugin();
    let language = plugin.settings.language || 'en';
    let { fileName, section, newContent } = input;

    // Find the closest file
    const matchedFile = findClosestFile(fileName, app);
    
    // Check if the file exists
    if (!matchedFile) {
        console.error(`Could not find any note with the name or similar to "${fileName}".`);
        return {
            success: false,
            error: `Could not find any note with the name or similar to "${fileName}".`
        };
    }

    // Read the file
    let text = await app.vault.read(matchedFile);
    let newNoteContent = '';

    // Prompts
    let sysPrompt = getSamplePrompt('write', language);
    if (section) {
        sysPrompt += `\nSearch for the section: ${section}. The new content should be written ONLY on that section. Keep the rest of the note as it is.`;
        if (language === 'es') {
            sysPrompt += `\nBusca la sección: ${section}. El nuevo contenido debe escribirse SOLO en esa sección. Mantén el resto de la nota como está.`;
        }
    }

    let humanPrompt = `Please update the content of the following note: \n### NOTE ###\n${text}\n### END NOTE ###\nUse this topic or specific content to update the note: ${newContent}.\nRETURN THE COMPLETE NOTE WITH THE UPDATED CONTENT.`;
    if (language === 'es') {
        humanPrompt = `Por favor, actualiza el contenido de la siguiente nota: \n### NOTA ###\n${text}\n### FIN DE LA NOTA ###\nUsa este tema o contenido específico para actualizar la nota: ${newContent}.\nDEVUELVE LA NOTA COMPLETA CON EL CONTENIDO ACTUALIZADO.`;
    }
    
    // Content generation
    try {
        if (newContent) {
            const provider = plugin.settings.provider;
            const model = plugin.settings.model;
            
            // Choose the apiKey depending on the provider
            let apiKey: string = getApiKey(provider);

            const llm = getLLM(provider, model, apiKey);
            if (!llm) throw new Error("Failed to initialize LLM");
            
            const response = await llm.invoke([
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
        await app.vault.modify(matchedFile, newNoteContent);
    } catch (err) {
        console.error('Error updating file:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
  
    return {
        success: true, 
        path: matchedFile.path,
        oldContent: text,
        newContent: newNoteContent,
    };
}, {
    // Tool schema and metadata
    name: 'update_note',
    description: 'Replaces the content of a note. Can be used to update a specific section or the whole note.',
    schema: z.object({
      fileName: z.string().describe('The name or path of the note to update'),
      section: z.string().optional().describe('The specific section to update. Can be a header, paragraph, topic to be searched on the note.'),
      newContent: z.string().describe('The new content to replace the section with. Also can be a topic to write the new content about.'),
    })
});