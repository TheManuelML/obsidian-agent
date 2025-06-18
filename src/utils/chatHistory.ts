import { TFile } from "obsidian";
import { getApp } from "src/plugin";
import { Message, MessageSender } from "src/types";

// Helper function to serialize attachments
const serializeAttachments = (attachments?: { notes?: TFile[], files?: File[] }) => {
  if (!attachments) return '';
  
  const serialized: string[] = [];
  
  if (attachments.notes?.length) {
    serialized.push(`\n**Attached Notes:**\n${attachments.notes.map(note => `- [[${note.path}]]`).join('\n')}`);
  }
  
  if (attachments.files?.length) {
    serialized.push(`\n**Attached Files:**\n${attachments.files.map(f => `- ${f.name}`).join('\n')}`);
  }
  
  return serialized.join('\n');
};

// Export a message to a chat file
export const exportMessage = async (message: Message, chatFile: TFile) => {
  const app = getApp(); 
  // Read the chat
  let chat = await app.vault.read(chatFile);
  if (!chat) chat = "";

  // Add the new message with attachments
  const attachmentsStr = serializeAttachments(message.attachments);
  chat += `\n**${message.sender.toUpperCase()}** - *${message.timestamp}*:\n${message.content}${attachmentsStr}`;
  
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
    const fullContent = match[3].trim();
    
    // Split content and attachments
    const attachmentsMatch = fullContent.match(/\*\*Attached Notes:\*\*\n([\s\S]*?)(?=\*\*Attached Files:\*\*|\n*$)/);
    const filesMatch = fullContent.match(/\*\*Attached Files:\*\*\n([\s\S]*?)(?=\n*$)/);
    
    let content = fullContent;
    const attachments: { notes?: TFile[], files?: File[] } = {};
    
    // Extract notes
    if (attachmentsMatch) {
      const notesContent = attachmentsMatch[1].trim();
      const notePaths = notesContent.split('\n').map(line => line.replace('- [[', '').replace(']]', ''));
      attachments.notes = notePaths.map(path => app.vault.getAbstractFileByPath(path) as TFile).filter(Boolean);
      content = content.replace(attachmentsMatch[0], '').trim();
    }
    
    // Extract files
    if (filesMatch) {
      const filesContent = filesMatch[1].trim();
      const fileNames = filesContent.split('\n').map(line => line.replace('- ', ''));
      attachments.files = fileNames.map(name => new File([], name));
      content = content.replace(filesMatch[0], '').trim();
    }
    
    messages.push({ 
      sender, 
      content, 
      timestamp,
      attachments: Object.keys(attachments).length > 0 ? attachments : undefined
    });
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