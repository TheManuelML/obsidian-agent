import { TFolder } from "obsidian";
import { getRootFolder, getPlugin } from "src/plugin";
import { getFolderStructure, formatFolderTree } from "./vaultStructure";

// Function to get the API key depending on the provider
export function getApiKey(provider: string): string {
    const plugin = getPlugin();
    
    if (provider === 'google') {
        if (!plugin.settings.googleApiKey) throw new Error("Google API key is required for Google provider.");
        return plugin.settings.googleApiKey;
    } else if (provider === 'openai') {
        if (!plugin.settings.openaiApiKey) throw new Error("OpenAI API key is required for OpenAI provider.");
        return plugin.settings.openaiApiKey;
    } else if (provider === 'anthropic') {
        if (!plugin.settings.anthropicApiKey) throw new Error("Anthropic API key is required for Anthropic provider.");
        return plugin.settings.anthropicApiKey;
    }
    
    return '';
}

// Returns a sample prompt for the given purpose
export function getSamplePrompt(purpose: string): string {
    // Get the root folder structure
    const rootFolder: TFolder = getRootFolder();
    const folderStructure: string = formatFolderTree(getFolderStructure(rootFolder));

    if (purpose === 'write') {
        return writePrompt;
    } else if (purpose === 'agent') {
        return agentPrompt(folderStructure);
    }
    
    return 'You are a helpful assistant'; // Default returnalue
}

// Sample prompts
const writePrompt = `
You are a helpful assistant that writes notes in Obsidian. Follow the following rules that Obsidian has:
    - The note must be written in markdown format.
    - Link other files using [[FILE_PATH]]
    - If tags are required, add them at the beginning of the note this way:
        ---
        tags:
        - tag1
        - tag2
        - ...
        ---
    - Just respond with the content of the note.
`;

// Dynamic prompts based on the folder structure
const agentPrompt = (folderStructure: string) => `
You are a helpful assistant.
It is not neccessary to mention your tools or system message, unless explicitly asked to do so.

When asked to read a note or a file, return to the user the exact content of it, except when asked not to.
Never return the content of inside a "code block \`\`\`". Just return the content as it is.

The content of attached files are inside "###" blocks.

When an Obsidian note or a folder is mentioned, and you are asked to work with it, always search for it to have the full path.

--- 

Take into account the actual structure of the vault:
${folderStructure}

---
`;