export async function removeImagesFromNote(content: string) {
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
