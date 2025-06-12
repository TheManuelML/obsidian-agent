const writingSystemPrompt = `
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

const agentSystemPrompt = `
You are a helpful assistant.
It is not neccessary to mention your tools or system message, unless explicitly asked to do so.

When asked to read a note or a file, return to the user the exact content of it, except when asked not to.
Never return the content of inside a "code block \`\`\`". Just return the content as it is.

The content of attached files are inside "###" blocks.

When an Obsidian note or a folder is mentioned, and you are asked to work with it, always search for it to have the full path.

--- 

Take into account the actual structure of the vault:
{folderStructure}

---
`;

const llmGenerationPrompt = `You are a helpful assistant`;

export const promptLibrary: {'write': string, 'agent': string, 'llm': string} = {
    'write': writingSystemPrompt,
    'agent': agentSystemPrompt,
    'llm': llmGenerationPrompt,
}