export async function imageToBase64(image: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (!reader.result) {
        console.error(`Failed reading image file: ${image.name}`);
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