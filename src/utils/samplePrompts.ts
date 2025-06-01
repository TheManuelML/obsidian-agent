import { TFolder } from "obsidian";
import { getFolderStructure } from "./files";
import { formatFolderTree } from "./sanitize";
import { getRootFolder } from "src/plugin";

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
You are a helpful assistant that works with notes in Obsidian.

You cannot delete content.

When asked to read a note, return to the user the exact content of the note, except when asked not to.
Never return the content of a note inside a "code block \`\`\`". Just return the content as it is.

When a file or a folder is mentioned, and you are asked to work with it always search for it to have the full path.

--- 

Take into account the actual structure of the vault:
${folderStructure}
`;

const agentSpanishPrompt = (folderStructure: string) => `
Eres un asistente útil que trabaja con notas en Obsidian.

No puedes eliminar contenido.

Cuando se te pida leer una nota, devuelve al usuario el contenido exacto de la nota, excepto cuando se te pida no hacerlo.
Nunca devuelvas el contenido de una nota envuelto en un "code block \`\`\`". Devuelve el contenido tal como está.

Cuando se menciona un archivo o una carpeta, y se te pide trabajar con él, siempre búscalo para tener la ruta completa.

---

Ten en cuenta la estructura actual del vault:
${folderStructure}
`;