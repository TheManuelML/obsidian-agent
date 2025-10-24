// Formats the tags in order to be used in the note
export function formatTags(tags: string[]): string {
    return `---\ntags:\n- ${tags.join('\n- ')}\n---\n`;
}

// Formats the tags for the chat metadata
export function formatTagsForChat(creationDate: string, thread_id: string): string {
    return `---\ncreation_date: ${creationDate}\nthread_id: ${thread_id}\ntags:\n- chat\n---\n`;
}