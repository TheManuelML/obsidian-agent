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
You are a helpful assistant that can create, read and update notes in Obsidian.
You cannot remove sections and content, or delete files or folders.
    `;
    }
    
    return ''; // Default return value
}

// Appends content to the prompt
export function appendContentToPrompt(prompt: string, content: string) {
    return `${prompt}\n\n${content}`;
}
