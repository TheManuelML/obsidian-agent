import { TFile } from "obsidian";
import { getApp } from "src/plugin";
import { Message, MessageSender } from "src/types";


// Export a message to a chat file
export const exportMessage = async (message: Message, chatFile: TFile) => {
  const app = getApp(); 
  // Read the chat
  let chat = await app.vault.read(chatFile);
  if (!chat) chat = "";

  // Add the new message
  chat += `\n**${message.sender.toUpperCase()}** - *${message.timestamp}*:\n${message.content}`;
  
  // Rewrite the chat file with the new message
  app.vault.modify(chatFile, chat);
};

// Import a conversation in an array of Message objects
export const importConversation = async (chatFile: TFile): Promise<Message[]> => {
  const app = getApp(); 
  const chat = await app.vault.read(chatFile);
  if (!chat) return [];

  const messages: Message[] = [];

  const messageBlocks = [
    ...chat.matchAll(
      /\*\*(user|bot)\*\* - \*(.*?)\*:\s*\n([\s\S]*?)(?=\n\*\*(?:user|bot)\*\* - \*|\n*$)/gi
    )
  ];

  for (const match of messageBlocks) {
    const sender = match[1].toLowerCase() === 'user' ? MessageSender.USER : MessageSender.BOT;
    const timestamp = match[2].trim();
    const content = match[3].trim();
    
    messages.push({ sender, content, timestamp });
  }  

  return messages;
};

// Function to get the thread_id of the chat
export const getThreadId = async (chatFile: TFile): Promise<string> => {
  const app = getApp();
  const content = await app.vault.read(chatFile);
  const match = content.match(/thread_id:\s*(chat-[\w:-]+)/);
  return match ? match[1] : '';
};

// Get the last n messages from a chat file
export const getLastNMessages = async (chatFile: TFile, n: number): Promise<Message[]> => {
  const messages = await importConversation(chatFile);
  return messages.slice(-n);
};

// Remove the last message from a chat file
export const removeLastMessage = async (chatFile: TFile) => {
  const app = getApp();
  const chat = await app.vault.read(chatFile);
  if (!chat) return;

  // Find the last message block
  const messageBlocks = [
    ...chat.matchAll(
      /\*\*(user|bot)\*\* - \*(.*?)\*:\s*\n([\s\S]*?)(?=\n\*\*(?:user|bot)\*\* - \*|\n*$)/gi
    )
  ];

  if (messageBlocks.length > 0) {
    // Get the last message block
    const lastBlock = messageBlocks[messageBlocks.length - 1];
    const lastBlockIndex = chat.lastIndexOf(lastBlock[0]);
    
    // Remove the last message block
    const newChat = chat.substring(0, lastBlockIndex).trim();
    
    // Rewrite the chat file without the last message
    app.vault.modify(chatFile, newChat);
  }
};