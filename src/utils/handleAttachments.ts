// Extract content form attached files to adapt them to the Agent
export async function processAttachedFiles(files: File[]): Promise<Array<{ name: string; type: string; content: string }>> {
    const results: Array<{ name: string; type: string; content: string }> = [];
  
    const processFile = (file: File): Promise<{ name: string; type: string; content: string }> => {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
          reject(new Error(`File is not an image: ${file.name}`));
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);  // base64
        reader.onload = () => {
          if (!reader.result) {
            reject(new Error('Failed to read image file'));
            return;
          }
          resolve({ name: file.name, type: file.type, content: reader.result as string });
        };
        reader.onerror = () => reject(new Error(`Error reading image file: ${file.name}`));
      });
    };
  
    for (const file of files) {
      try {
        const result = await processFile(file);
        results.push(result);
      } catch (e) {
        console.error(`Error processing file ${file.name}:`, e);
      }
    }
  
    return results;
}