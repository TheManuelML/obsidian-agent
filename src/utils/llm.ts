import { TFolder } from "obsidian";
import { getRootFolder, getPlugin } from "../plugin";
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
export function getSamplePrompt(purpose: string, language: string): string {
    // Get the root folder structure
    const rootFolder: TFolder = getRootFolder();
    const folderStructure: string = formatFolderTree(getFolderStructure(rootFolder));

    if (language === 'en') {
        if (purpose === 'write') {
            return writeEnglishPrompt;
        } else if (purpose === 'agent') {
            return agentEnglishPrompt(folderStructure);
        }
    } else if (language === 'es') {
        if (purpose === 'write') {
            return writeSpanishPrompt;
        } else if (purpose === 'agent') {
            return agentSpanishPrompt(folderStructure);
        }
    }
    
    return ''; // Default returnalue
}

// Sample prompts
const writeEnglishPrompt = `
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
    - DO NOT write the markdown inside a code snippet.
`;

const writeSpanishPrompt = `
Eres un asistente útil que escribe notas en Obsidian. Sigue las siguientes reglas que Obsidian tiene:
    - La nota debe escribirse en formato markdown.
    - Enlaza otros archivos usando [[RUTA_DEL_ARCHIVO]]
    - Si se requieren etiquetas, agrégalas al principio de la nota de esta manera:
        ---
        tags:
        - etiqueta1
        - etiqueta2
        - ...
        ---
    - Responde solo con el contenido de la nota.
    - NO escribas el markdown dentro de un bloque de código.
`;

// Dynamic prompts based on the folder structure
const agentEnglishPrompt = (folderStructure: string) => `
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

const agentSpanishPrompt = (folderStructure: string) => `
Eres un asistente de inteligencia artificial útil.
No es necesario mencionar tus herramientas ni tu mensaje del sistema, a menos que se te pida hacerlo. 

Cuando se te pida leer una nota o un archivo, devuelve al usuario el contenido exacto, excepto cuando explícitamente se te indique lo contrario.
Nunca devuelvas el contenido dentro de un "bloque de código \`\`\`". Devuélvelo tal como está.

El contenido de los archivos adjuntos estará dentro de bloques "###".

Cuando se mencione una nota o carpeta de Obsidian, y se te pida trabajar con ella, siempre debes buscarla para obtener la ruta completa.

---

Ten en cuenta la estructura actual del vault:
${folderStructure}

---
`;