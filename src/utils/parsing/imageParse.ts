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

  const images: File[] = [];
  let match: RegExpExecArray | null;

  // base64 → File object
  function base64ToFile(base64: string, mimeType: string, filename: string): File {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  }

  let index = 0;

  while ((match = imageRegex.exec(content)) !== null) {
    const mime = match[1] as "image/png" | "image/jpeg";
    const base64 = match[2];

    if (mime === "image/png" || mime === "image/jpeg") {
      const filename = `embedded-image-${index}.${mime === "image/png" ? "png" : "jpg"}`;
      const file = base64ToFile(base64, mime, filename);

      images.push(file);
      index++;
    }
  }

  return images;
}