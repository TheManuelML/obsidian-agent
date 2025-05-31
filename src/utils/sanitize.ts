import { TFolder } from "obsidian";
import { buildTree } from "./files";

// Sanitizes the path
export function sanitizePath(p: string): string {
    return p
        .replace(/(\.\.\/|\/{2,})/g, '/')  // remove '..' and double slashes
        .replace(/^\/+|\/+$/g, '');        // remove leading and trailing slashes
}

// Formats the tags in order to be used in the note
export function formatTags(tags: string[]): string {
    return `---\ntags:\n- ${tags.join('\n- ')}\n---\n`;
}

// Detects if the content is a code block or inline code snippet
// Returns: [{ text: string, isCode: boolean }, ...]
export function parseCodeSnippets(content: string): { text: string, isCode: boolean }[] {
    const regex = /```([\s\S]*?)```/g;
    const result: { text: string, isCode: boolean }[] = [];
    let lastIndex = 0;
    let match;
  
    while ((match = regex.exec(content)) !== null) {
      // Texto antes del bloque de código
      if (match.index > lastIndex) {
        result.push({
          text: content.slice(lastIndex, match.index),
          isCode: false
        });
      }
  
      // Bloque de código (sin los delimitadores ```)
      result.push({
        text: match[1],
        isCode: true
      });
  
      lastIndex = regex.lastIndex;
    }
  
    // Texto restante después del último bloque de código
    if (lastIndex < content.length) {
      result.push({
        text: content.slice(lastIndex),
        isCode: false
      });
    }
  
    return result;
}

// Formats a JSON of folders to a tree
export function formatTree(folder: TFolder): string {
  // Get the JSON with the structure of the folder
  const json = buildTree(folder);
  
  return ""
}