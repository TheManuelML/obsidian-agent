export function imageToBase64(image: File): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!image.type.startsWith("image/")) {
            console.error(`File is not an image: ${image.name}`);
            return resolve("");
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          if (!reader.result) {
            console.error('Failed to read image file');
            return resolve("");
          }
          resolve(reader.result as string);
        };
        reader.onerror = () => {
            console.error(`Error reading image file: ${image.name}`)
            reject("");
        };
        reader.readAsDataURL(image);
    });
}