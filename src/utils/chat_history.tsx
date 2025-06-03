import { App, TFile } from "obsidian";
import { User, Bot } from "lucide-react";

// Export a message to a chat file
export const exportMessage = async (app: App, message: Message, chatFile: TFile) => {
  // Read the chat
  let chat = await app.vault.read(chatFile);
  if (!chat) chat = "";

  // Add the new message
  chat += `\n**${message.type.toUpperCase()}** - *${message.timestamp}*:\n${message.text}`;
  
  // Rewrite the chat file with the new message
  app.vault.modify(chatFile, chat);
};

// Import a conversation in an array of Message objects
export const importConversation = async (app: App, chatFile: TFile): Promise<Message[]> => {
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
