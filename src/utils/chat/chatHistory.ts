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
  // Identify header (non-JSON) lines at the top and JSON message lines after
  const firstMsgIdx = lines.findIndex((l) => l.trim().startsWith("{"));
  const headerLines = firstMsgIdx === -1 ? lines : lines.slice(0, firstMsgIdx);
  const messageLines = firstMsgIdx === -1 ? [] : lines.slice(firstMsgIdx).filter((l) => l.trim().startsWith("{"));

  // If n <= 0, keep only headers (remove all messages)
  const safeN = Math.max(0, n);
  const keptMessages = messageLines.slice(0, safeN);

  const newContent = [...headerLines, ...keptMessages].join("\n");
  await app.vault.modify(chat, newContent);
}

export async function removeLastNMessages(chat: TFile, n: number) {
  const app = getApp();
  
  const content = await app.vault.read(chat);

  const lines = content.split("\n");
  // No-op if n <= 0
  if (n <= 0) {
    return;
  }

  // Identify header (non-JSON) lines at the top and JSON message lines after
  const firstMsgIdx = lines.findIndex((l) => l.trim().startsWith("{"));
  const headerLines = firstMsgIdx === -1 ? lines : lines.slice(0, firstMsgIdx);
  const messageLines = firstMsgIdx === -1 ? [] : lines.slice(firstMsgIdx).filter((l) => l.trim().startsWith("{"));

  const keptCount = Math.max(0, messageLines.length - n);
  const keptMessages = messageLines.slice(0, keptCount);

  const newContent = [...headerLines, ...keptMessages].join("\n");
  await app.vault.modify(chat, newContent);
}