// Extract content form attached files to adapt them to the Agent
export async function processAttachedFiles(files: File[]): Promise<Array<{ name: string; type: string; content: string }>> {
    const results: Array<{ name: string; type: string; content: string }> = [];
  
    const processFile = (file: File): Promise<{ name: string; type: string; content: string }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
  
        if (file.type.startsWith("image/")) {
          reader.readAsDataURL(file);  // base64
          reader.onload = () => {
            if (!reader.result) {
              reject(new Error('Failed to read image file'));
              return;
            }
            resolve({ name: file.name, type: file.type, content: reader.result as string });
          };
          reader.onerror = () => reject(new Error(`Error reading image file: ${file.name}`));
        }
  
        else {
          resolve({ name: file.name, type: file.type, content: "[Unsupported file type]" });
        }
      });
    };
  
    for (const file of files) {
      try {
        const result = await processFile(file);
        results.push(result);
      } catch (e) {
        console.error(`Error processing file ${file.name}:`, e);
        results.push({ 
          name: file.name, 
          type: file.type, 
          content: `[Error: ${e instanceof Error ? e.message : 'Unknown error'}]` 
        });
      }
    }
  
    return results;
}