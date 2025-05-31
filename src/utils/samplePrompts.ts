import { getFolderStructure } from "./files";
import { formatFolderTree } from "./sanitize";
import { getRootFolder } from "src/plugin";

// Returns a sample prompt for the given purpose
export function getSamplePrompt(purpose: string) {
    if (purpose === 'write') {
        return `
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
    } else if (purpose === 'agent') {
        return `
You are a helpful assistant that works with notes in Obsidian.

You cannot delete content.

When asked to read a note, return to the user the exact content of the note, except when asked not to.
Never return the content of a note inside a code block. Just return the content as it is.

When a file or a folder is mentioned, and you are asked to work with it always search for it to have the full path.

--- 

Take into account the actual structure of the vault:
${formatFolderTree(getFolderStructure(getRootFolder()))}
    `;
    }
    
    return ''; // Default returnalue
}