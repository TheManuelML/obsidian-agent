export async function imageToBase64(image: File): Promise<{ mimeType: string, base64: string }> {
    return new Promise((resolve, reject) => {
        if (!image.type.startsWith("image/")) {
            console.error(`File is not an image: ${image.name}`);
            return resolve({ mimeType: '', base64: '' });
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (!reader.result) {
                console.error('Failed to read image file');
                return resolve({ mimeType: '', base64: '' });
            }
            // reader.result is a data URL: data:image/png;base64,xxxx
            const result = reader.result as string;
            const matches = result.match(/^data:(image\/[^;]+);base64,(.+)$/);
            if (!matches) {
                console.error('Invalid base64 image format');
                return resolve({ mimeType: '', base64: '' });
            }
            resolve({ mimeType: matches[1], base64: matches[2] });
        };
        reader.onerror = () => {
            console.error(`Error reading image file: ${image.name}`)
            reject({ mimeType: '', base64: '' });
        };
        reader.readAsDataURL(image);
    });
}