import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Notice, TFile } from 'obsidian';
import { getApp, getSettings } from "src/plugin";
import { findClosestFile, findMatchingFolder } from 'src/utils/searching';
import { getNextAvailableFileName } from "src/utils/renaming";
import { formatTags } from 'src/utils/formating';
import { parseImageFromNote } from "src/utils/parsing";
import { ModelManager } from 'src/backend/managers/modelManager';
import { PromptTemplateManager } from 'src/backend/managers/prompts/promptManager';

// Obsidian tool to write notes
export const createNote = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    const settings = getSettings();
    let { topic, name = 'Generated note', tags = [], context, dirPath = '', content, useLLM = true } = input; 

    // Find the closest folder
    const matchedFolder = findMatchingFolder(dirPath);
    // Check if the folder exists
    if (!matchedFolder) {
        console.error(`Could not find any folder with the path "${dirPath}"`);
        return {
            success: false,
            error: `Could not find any folder with the path "${dirPath}"`
        };
    }

    // Sanitize the directory path
    dirPath = matchedFolder.path;
    // Adding extension to name
    name = name + '.md';
    // Full path with the directory path and the name of the file
    let fullPath = dirPath + '/' + name; // -> Dir/Name.md
    if (!dirPath || dirPath === '/') fullPath = name; // -> Name.md

    // Content generation
    if (!content) {
        if (topic && useLLM) {
            try {
                // Get prompt template
                const promptManager = new PromptTemplateManager();
                const promptValue = await promptManager.getSimplePromptTemplate('write', topic);
                
                let sysPrompt = promptValue.messages[0].content; // Extract the string from SystemMessage type
                if (context) sysPrompt = `${sysPrompt}\nUse the following context to write the note: ${context}.`;
                
                const humanPrompt = `Please write a markdown note about ${topic}.` + (tags.length > 0 ? ` Add the following tags: ${tags.join(', ')}.` : '');
                
                // Initialize LLM
                const llm = ModelManager.getInstance().getModel();
                if (!llm) {
                    const errorMsg = "Failed to initialize LLM" 
                    new Notice(errorMsg, 5000);
                    if (settings.debug) console.error(errorMsg);
                    throw new Error(errorMsg);
                }

                // Invoke the LLM
                const response = await llm.invoke([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: humanPrompt },
                ]);
                content = response.content.toString();
            
            } catch (err) {
                const errorMsg = 'Error invoking LLM: ' + err;  
                new Notice(errorMsg, 5000);
                if (settings.debug) console.error(errorMsg);
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
    if (app.vault.getAbstractFileByPath(fullPath)) {
        // Append a number to the file name if it already exists
        const newName = getNextAvailableFileName(name, dirPath);
        
        name = newName;

        fullPath = dirPath + '/' + name;
        if (!dirPath || dirPath === '/') fullPath = name; // -> Name.md

    }

    try {
        // Write the note in Obsidian
        await app.vault.create(fullPath, content);
    } catch (err) {
        const errorMsg = 'Error creating file in Obsidian: ' + err;  
        new Notice(errorMsg, 5000);
        if (settings.debug) console.error(errorMsg);
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
        fullPath: fullPath,
        parentDir: dirPath
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
        dirPath: z.string().optional().describe('The path of the directory where the note is going to be stored'),
        content: z.string().optional().describe('Custom markdown content to use instead of generating'),
        useLLM: z.boolean().optional().default(true).describe('Whether to use the LLM to generate the content.')
    })
})


// Obsidian tool to update or write on existing notes
export const editNote = tool(async (input) => {
    const app = getApp();
    const settings = getSettings();
    const { fileName, activeNote, newContent, useLLM = true, tags = [], context } = input;
    let matchedFile: TFile | null;

    if (activeNote) {
        // Detect the current note
        matchedFile = app.workspace.getActiveFile()
        if (!matchedFile) {
            const errorMsg = "There is not an opened file"
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
            return {
                success: false,
                error: errorMsg
            }
        }
    } else if (fileName && !activeNote) {
        // Find the closest file
        matchedFile = findClosestFile(fileName);
        // Check if the file exists
        if (!matchedFile) {
            const errorMsg = `Could not find any note with the name or similar to "${fileName}".`
            if (settings.debug) console.error(errorMsg);
            return {
                success: false,
                error: errorMsg,
            };
        }
    } else {
        const errorMsg = "No file name provided and 'Active Note' is not set to true.";
        new Notice(errorMsg, 5000);
        if (settings.debug) console.error(errorMsg);
        return {
            success: false,
            error: errorMsg
        };
    }

    // Read the file
    let oldContent = await app.vault.read(matchedFile);
    let updatedContent = '';

    // If the user do not want to generate content replace directly
    if (!useLLM) {
        updatedContent = newContent || oldContent;
        if (tags.length > 0) {
            const formattedTags = formatTags(tags);
            updatedContent += `\n\n${formattedTags}`;
        }
    } else {
        try {
            const llm = ModelManager.getInstance().getModel();
            if (!llm) {
                const errorMsg = "Failed to initialize LLM" 
                new Notice(errorMsg, 5000);
                if (settings.debug) console.error(errorMsg);
                throw new Error(errorMsg);
            }

            const promptManager = new PromptTemplateManager();
            const promptValue = await promptManager.getSimplePromptTemplate('write', newContent || '');
            
            let sysPrompt = promptValue.messages[0].content; // Extract the string from SystemMessage type
            if (context) sysPrompt += `\nYou can use the following context while editing: ${context}`;

            const humanPrompt = `Update the following markdown note:\n###\n${oldContent}\n###` +
                (newContent ? `Apply the following update or topic: "${newContent}".\n`: '') +
                (tags.length > 0 ? `Add or update with these tags: ${tags.join(', ')}.\n` : '') +
                `Return the full updated markdown note.`;

            const response = await llm.invoke([
                { role: 'system', content: sysPrompt },
                { role: 'user', content: humanPrompt },
            ]);

            updatedContent = response.content.toString();
        } catch (err) {
            const errorMsg = 'Error invoking LLM: ' + err;  
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error'
            };
        }
    }

    // Save the updated content
    try {
        await app.vault.modify(matchedFile, updatedContent);
    } catch (err) {
        const errorMsg = 'Error updating file: ' + err;  
        new Notice(errorMsg, 5000);
        if (settings.debug) console.error(errorMsg);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    return {
        success: true,
        usedLLM: useLLM,
        path: matchedFile.path,
        oldContent,
        newContent: updatedContent,
        tags,
    };
}, {
    name: 'update_note',
    description: 'Writes, replace and edit content of a note. Can use LLM or not, supports tags and context. Specify the note name or detect the active note if no name provided.',
    schema: z.object({
        fileName: z.string().optional().describe('The name or path of the note to edit'),
        activeNote: z.boolean().default(false).optional().describe('If no filename provided read the active note'),
        newContent: z.string().optional().describe('New content or instructions to apply to the note'),
        useLLM: z.boolean().optional().default(true).describe('Whether to use the LLM to generate the updated note'),
        tags: z.array(z.string()).optional().describe('Tags to add or update in the note'),
        context: z.string().optional().describe('Additional context for the LLM to use when editing'),
    })
});


// Obsidian tool to read notes
export const readNote = tool(async (input) => {
    const app = getApp();
    const settings = getSettings();
    const { fileName, activeNote } = input;
    let matchedFile: TFile | null;

    if (!fileName && activeNote) {
        // Detect the current note
        matchedFile = app.workspace.getActiveFile()
        if (!matchedFile) {
            const errorMsg = "There is not an opened file"
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
            return {
                success: false,
                error: errorMsg
            }
        }
    } else if (fileName) {
        // Find the closest file
        matchedFile = findClosestFile(fileName);
        
        // Check if the file exists
        if (!matchedFile) {
            console.error(`Could not find any note with the name or similar to "${fileName}".`);
            return {
                success: false,
                error: `Could not find any note similar to "${fileName}".`
            };
        }
    } else {
        const errorMsg = "No file name provided and 'Active Note' is not set to true.";
        new Notice(errorMsg, 5000);
        if (settings.debug) console.error(errorMsg);
        return {
            success: false,
            error: errorMsg
        };
    }

    // Read the file
    try {
        const content = await app.vault.read(matchedFile);
        const cleanedContent = await parseImageFromNote(content);
        
        return {
            success: true,
            content: cleanedContent.content,
            path: matchedFile.path
        };
    } catch (err) {
        const errorMsg = 'Error reading file: ' + (err instanceof Error ? err.message : String(err));  
        new Notice(errorMsg, 5000);
        if (settings.debug) console.error(errorMsg);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}, {
    // Tool schema and metadata
    name: 'read_note',
    description: 'Reads the content of a note in Obsidian by name or by detecting the currently active note. The content itself is not needed as input.',
    schema: z.object({
        fileName: z.string().optional().describe('The name or path (can be fuzzy) of the note to read'),
        activeNote: z.boolean().default(false).optional().describe('If no filename provided read the active note') 
    })
});