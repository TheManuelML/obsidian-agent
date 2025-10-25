export async function removeImagesFromNote(content: string) {
  // Detect images ![NAME](data:image/png;base64,...)
  const base64ImageRegex = /!\[[^\]]*]\((data:image\/[a-zA-Z]+;base64,[^)]+)\)/g;

  // Detect ebedded images ![[IMAGE_NAME.png]]
  const embeddedImageRegex = /!\[\[([^\]]+\.(png|jpg|jpeg|gif|svg))\]\]/g;

  let match: RegExpExecArray | null;
  let cleanedContent = content;

  while ((match = base64ImageRegex.exec(content)) !== null) {
    // Remove the image from the content
    cleanedContent = cleanedContent.replace(match[0], "");
  }

  while ((match = embeddedImageRegex.exec(content)) !== null) {
    // Remove the embedded image from the content
    cleanedContent = cleanedContent.replace(match[0], "");
  }
  
  return cleanedContent.trim();
}

export async function extractImagesFromNote(content: string) {
  // Detect images, capture MIME type and base64
  const imageRegex = /!\[[^\]]*]\(data:(image\/[a-zA-Z]+);base64,([^)]+)\)/g;

  const images: Array<{ base64: string; mimeType: "image/png" | "image/jpeg" }> = [];
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(content)) !== null) {
    const mime = match[1] as "image/png" | "image/jpeg";
    const base64 = match[2];

    // Filter only png and jpeg
    if (mime === "image/png" || mime === "image/jpeg") {
      images.push({ base64, mimeType: mime });
    }
  }

  return images;
}