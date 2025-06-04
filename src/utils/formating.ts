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

// Formats the tags for the chat metadata
export function formatTagsForChat(creationDate: string, thread_id: string): string {
    return `---\ncreation_date: ${creationDate}\nthread_id: ${thread_id}\ntags:\n- chat\n---\n`;
}

// Format messages to a string for display
export const formatMessagesForDisplay = (messages: Message[]): string => {
    return messages.map(message => {
      return `**${message.type.toUpperCase()}** - *${message.timestamp}*:\n${message.text}`;
    }).join('\n\n');
  }