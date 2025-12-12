import { TFile, FileSystemAdapter } from "obsidian";
import { getApp } from "src/plugin";
import path from "path";
import fs from "fs";


// Return File objects for every embedded image in a note
export function getEmbeds(file: TFile) { 
  if (file.extension !== "md") return [];

  const app = getApp();
  const meta = app.metadataCache.getFileCache(file);
  const embeddedFiles = meta?.embeds?.map((embed) => embed.link);

  if (embeddedFiles && embeddedFiles.length > 0) {
    const images: File[] = [];

    let vaultPath = "";
    const adapter = app.vault.adapter;

    if (adapter instanceof FileSystemAdapter) {
      vaultPath = adapter.getBasePath();
    } else {
      console.error("Vault adapter is not a FileSystemAdapter. Cannot determine vault path.");
      return [];
    }

    for (const embedFile of embeddedFiles) {
      // Ignore non-image embeds
      if (
        !embedFile.endsWith(".png") &&
        !embedFile.endsWith(".jpg") &&
        !embedFile.endsWith(".jpeg")
      ) {
        continue;
      }

      try {
        // Find referenced file in vault
        const match = app.vault
          .getFiles()
          .find((f) => f.extension !== "md" && f.name === embedFile);

        if (!match) continue;

        const filePath = path.join(vaultPath, match.path);

        const buffer = fs.readFileSync(filePath);

        // Detect MIME type
        const mimeType =
          match.extension === "png"
            ? "image/png"
            : "image/jpeg";

        // Convert Buffer → File (copy into ArrayBuffer-backed Uint8Array)
        const uint8Array = Uint8Array.from(buffer);
        const fileObj = new File([uint8Array], match.name, { type: mimeType });

        images.push(fileObj);
      } catch (error) {
        console.error("Error reading embedded file:", error);
        return [];
      }
    }

    return images;
  }

  return [];
}
