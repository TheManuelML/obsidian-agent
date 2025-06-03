// Sanitizes the path
export function sanitizePath(p: string): string {
    return p
        .replace(/(\.\.\/|\/{2,})/g, '/')
        .replace(/^\/+|\/+$/g, ''); // remove '..', double slashes, and leading and trailing slashes
}

// Formats the tags in order to be used in the note
export function formatTags(tags: string[]): string {
    return `---\ntags:\n- ${tags.join('\n- ')}\n---\n`;
}