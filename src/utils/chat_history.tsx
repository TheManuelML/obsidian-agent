import { App, TFile } from "obsidian";
import { User, Bot } from "lucide-react";

// Export a message to a chat file
export const exportMessage = async (app: App, message: Message, chatFile: TFile) => {
  // Read the chat
  let chat = await app.vault.read(chatFile);
  if (!chat) chat = "";

  // Add the new message
  chat += `\n**${message.type.toUpperCase()}**: ${message.text}`;
  
  // Rewrite the chat file with the new message
  app.vault.modify(chatFile, chat);
};

// Import a conversation in an array of Message objects
export const importConversation = async (app: App, chatFile: TFile): Promise<Message[]> => {
  const chat = await app.vault.read(chatFile);
  if (!chat) return [];

  const messages: Message[] = [];
  const lines = chat.split('\n');
  for (const line of lines) {
    const match = line.match(/^\*\*(user|bot)\*\*:\s([\s\S]*)$/i);
    ;
    if (match) {
      const type = match[1].toLowerCase() as 'user' | 'bot';
      const text = match[2];
      const sender = type === 'user' ? <User size={20} /> : <Bot size={20} />;
      messages.push({ sender, text, type });
    }
  }  

  return messages;
};
