export async function parseImageFromNote(content: string) {
    // Detect images ![NAME](data:image/png;base64,...)
    const imageRegex = /!\[[^\]]*]\((data:image\/[a-zA-Z]+;base64,[^)]+)\)/g;
  
    const images: string[] = [];
    let match: RegExpExecArray | null;
    let cleanedContent = content;
  
    while ((match = imageRegex.exec(content)) !== null) {
      images.push(match[1]);
      cleanedContent = cleanedContent.replace(match[0], ""); // Elimina la imagen del contenido
    }
  
    return {
      content: cleanedContent.trim(),
      images,
    };
}

// Remove intial and trailing backsticks
export function parseMarkdownCodeBlock(content: string): string {
  const markdownBlockRegex = /^```markdown\s*\n([\s\S]*?)\n```$/;
  const match = content.match(markdownBlockRegex);

  if (match) {
    return match[1]; // Devuelve solo el contenido dentro del bloque
  }

  return content; // Si no hay coincidencia, regresa el string original
}