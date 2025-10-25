export async function removeImagesFromNote(content: string) {
  // Detect images ![NAME](data:image/png;base64,...)
  const imageRegex = /!\[[^\]]*]\((data:image\/[a-zA-Z]+;base64,[^)]+)\)/g;

  let match: RegExpExecArray | null;
  let cleanedContent = content;

  while ((match = imageRegex.exec(content)) !== null) {
    // Remove the image from the content
    cleanedContent = cleanedContent.replace(match[0], "");
  }
  
  return cleanedContent.trim();
}

export async function extractImagesFromNote(content: string) {
  // Detect images ![NAME](data:image/png;base64,...)
  const imageRegex = /!\[[^\]]*]\((data:image\/[a-zA-Z]+;base64,[^)]+)\)/g;

  const images: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  return images;
}