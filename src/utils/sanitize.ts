// Sanitizes the path
export function sanitizePath(path: string): string {
    return path.replace(/(\.\.\/|\/{2,})/g, '/').replace(/\/+$/, '') + '/';
}

// Formats the tags to be used in the note
export function formatTags(tags: string[]): string {
    return `---\ntags:\n- ${tags.join('\n- ')}\n---\n`;
}