// Sanitizes the path
export function sanitizePath(p: string): string {
    return p
        .replace(/(\.\.\/|\/{2,})/g, '/')  // remove '..' and double slashes
        .replace(/^\/+|\/+$/g, '');        // remove leading and trailing slashes
}

// Formats the tags to be used in the note
export function formatTags(tags: string[]): string {
    return `---\ntags:\n- ${tags.join('\n- ')}\n---\n`;
}

// Detects if the content is a code block
export function detectCodeSnippet(content: string): boolean {
    return /```[\s\S]*?```/.test(content);
}