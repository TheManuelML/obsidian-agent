import { TFile } from "obsidian";
import { getApp } from "src/plugin";
import { Message } from "src/types/chat";

// Export a message to a chat file
export function exportMessage(message: Message, chat: TFile) {
  const app = getApp();

  const payload: string = JSON.stringify(message);
  app.vault.process(chat, (data) => {
    const clean = data.trim(); 
    return clean.length > 0 ? clean + "\n" + payload : payload;
  });

  return;
}

// Read the content of a chat file and return the messages
export async function importConversation(chat: TFile): Promise<Message[]> {
  const app = getApp();

  const content = await app.vault.read(chat);
  if (!content) return [];

  // Divide lines and parse messages
  const messages = content
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.length > 0 && line.startsWith("{"))
  .map(line => { 
    return JSON.parse(line) 
  })
  .filter((msg): msg is Message => msg !== null);

  return messages;
}

// Function to get the thread_id of the chat
export async function getThreadId(chat: TFile) {
  const app = getApp();
  const content = await app.vault.read(chat);

  const match = content.match(/thread_id:\s*(chat-[\w:-]+)/);
  return match ? match[1] : '';
}

// Remove the last message from a chat file
export async function removeMessagesAfterIndexN(chat: TFile, n: number) {
  const app = getApp();
  
  const content = await app.vault.read(chat);

  const lines = content.split("\n");
  if (lines.length === 0 || n <= 0) {
    // Clean all the messages if n is 0 or less
    await app.vault.modify(chat, "");
  }

  // Return the lines between 0 and n
  const newLines = lines.slice(0, n);

  // Rewrite the content
  await app.vault.modify(chat, newLines.join("\n"));
}