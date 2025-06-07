import { TFile } from "obsidian";
import { User, Bot } from "lucide-react";
import { getApp } from "src/plugin";
import { Message } from "src/types";


// Export a message to a chat file
export const exportMessage = async (message: Message, chatFile: TFile) => {
  const app = getApp(); 
  // Read the chat
  let chat = await app.vault.read(chatFile);
  if (!chat) chat = "";

  // Add the new message
  chat += `\n**${message.type.toUpperCase()}** - *${message.timestamp}*:\n${message.text}`;
  
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
    const type = match[1].toLowerCase() as 'user' | 'bot';
    const timestamp = match[2].trim();
    const text = match[3].trim();
    const sender = type === 'user' ? <User size={20} /> : <Bot size={20} />;
    
    messages.push({ sender, text, type, timestamp });
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