// Detects if the content is a code block or inline code snippet
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
  
    return result; // Returns: [{ text: string, isCode: boolean }, ...]
}

// Detects if the content is a link to other page
export function parseLinkToNote(content: string): {text: string, isLink: boolean}[] {
    const regex = /\[\[([\w\s/]+)\]\]/g;
    const result: {text: string, isLink: boolean}[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        // Text before the link
        if (match.index > lastIndex) {
            result.push({
                text: content.slice(lastIndex, match.index),
                isLink: false
            });
        }

        // The link itself (without the [[]] delimiters)
        result.push({
            text: match[1],
            isLink: true
        });

        lastIndex = regex.lastIndex;
    }

    // Remaining text after the last link
    if (lastIndex < content.length) {
        result.push({
            text: content.slice(lastIndex),
            isLink: false
        });
    }

    return result;
}