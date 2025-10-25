import { TFile, FileSystemAdapter } from "obsidian";
import { getApp } from "src/plugin";
import path from "path";
import fs from "fs";

export function getEmbeds(file: TFile) {
  if (file.extension !== "md") return [];

  const app = getApp();
  
  const meta = app.metadataCache.getFileCache(file);
  const embeddedFiles = meta?.embeds?.map((embed) => embed.link);
  
  if (embeddedFiles && embeddedFiles.length > 0) {  
    const base64Images: Array<{base64: string, mimeType: "image/png" | "image/jpeg"}> = [];
    
    let vaultPath = "";
    let adapter = app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      vaultPath = adapter.getBasePath();
    } else {
      console.error("Vault adapter is not a FileSystemAdapter. Cannot determine vault path.");
      return [];
    }

    for (const embedFile of embeddedFiles) {
      // If not an image, skip
      if (!embedFile.endsWith(".png") && !embedFile.endsWith(".jpg") && !embedFile.endsWith(".jpeg")) continue;



      try {
        // Search the file by its name
        const match = app.vault.getFiles().find(f => f.extension !== "md" && f.name === embedFile);
        
        if (match) {
          const filePath = path.join(vaultPath, match.path);
          
          const buffer = fs.readFileSync(filePath);

          base64Images.push({
            base64: buffer.toString("base64"), 
            mimeType: match.extension === "png" ? "image/png" : "image/jpeg"
          });
        }
      } catch (error) {
        console.error("Error reading embedded file:", error);
        return [];
      }
    }

    return base64Images;
  }

  return [];
}
