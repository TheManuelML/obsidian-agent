import { TFile } from "obsidian";
import { getApp } from "src/plugin";
import { Message, MessageSender, ToolCall } from "src/types";

// Helper function to serialize attachments
const serializeAttachments = (attachments?: TFile[]) => {
  if (!attachments || attachments.length === 0) return '';
  
  return `\n**Attached notes:**\n${attachments.map(note => `- [[${note.path}]]`).join('\n')}`;
};

// Export a message to a chat file
export const exportMessage = async (message: Message, chatFile: TFile) => {
  const app = getApp(); 

  // Add the new message with attachments
  const attachmentsStr = serializeAttachments(message.attachments);
  
  // Serialize tool calls if present
  let toolCallsStr = "";
  if (message.toolCalls && message.toolCalls.length > 0) {
    toolCallsStr = `\n\r**Tool calls:**\n${message.toolCalls.map(tc => `- ${JSON.stringify(tc)}`).join('\n')}`;
  }

  // Rewrite the chat file with the new message
  app.vault.process(chatFile, (data) => {
    return data += `\n\r**${message.sender.toUpperCase()}**:\n${toolCallsStr}${toolCallsStr ? '\n\r' : ''}${message.content}${attachmentsStr}`;
  })
};

// Import a conversation in an array of Message objects
export const importConversation = async (chatFile: TFile): Promise<Message[]> => {
  const app = getApp(); 
  const chat = await app.vault.read(chatFile);
  if (!chat) return [];

  const messages: Message[] = [];

  const messageBlocks = [
    ...chat.matchAll(
      /\n\r\*\*(user|bot)\*\*:\s*\n([\s\S]*?)(?=\n\r\*\*(?:user|bot)\*\*:|\n*$)/gi
    )
  ];

  for (const match of messageBlocks) {
    const sender = match[1].toLowerCase() === 'user' ? MessageSender.USER : MessageSender.BOT;
    let fullContent = match[2].trim();
    
    // Extract tool calls if present
    let toolCalls: ToolCall[] = [];
    const toolCallsBlockMatch = fullContent.match(/\*\*Tool calls:\*\*[\r\n]+((?:- .*\n?)*)/);
    if (toolCallsBlockMatch) {
      const toolCallsBlock = toolCallsBlockMatch[1];
      toolCalls = toolCallsBlock
        .split('\n')
        .map(line => line.replace(/^- /, '').trim())
        .filter(Boolean)
        .map(str => {
          try { return JSON.parse(str); } catch { return undefined; }
        })
        .filter(Boolean);
      fullContent = fullContent.replace(toolCallsBlockMatch[0], '').replace(/^\n+/, '').trim();
    }

    // Split content and attachments
    const attachmentsMatch = fullContent.match(/\*\*Attached notes:\*\*\n([\s\S]*?)(?=\*\*Attached files:\*\*|\n*$)/);
    
    let content = fullContent;
    let attachments: TFile[] = [];
    
    // Extract notes
    if (attachmentsMatch) {
      const notesContent = attachmentsMatch[1].trim();
      const notePaths = notesContent.split('\n').map(line => line.replace('- [[', '').replace(']]', ''));
      attachments = notePaths
        .map(path => app.vault.getAbstractFileByPath(path))
        .filter((file): file is TFile => file instanceof TFile);
      content = content.replace(attachmentsMatch[0], '').trim();
    }
    
    // Remove files section from content if present (we don't support files in Message type yet)
    const filesMatch = fullContent.match(/\*\*Attached files:\*\*\n([\s\S]*?)(?=\n*$)/);
    if (filesMatch) {
      content = content.replace(filesMatch[0], '').trim();
    }
    
    messages.push({ 
      sender, 
      content,
      attachments,
      toolCalls
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

  // Rewrite the chat file without the last message
  app.vault.process(chatFile, (data) => {
    if (!data) return "";

    // Extract the message blocks with regex
    const messageBlocks = [
      ...data.matchAll(
        /\n\r\*\*(user|bot)\*\*:\s*\n([\s\S]*?)(?=\n\r\*\*(?:user|bot)\*\*:|\n*$)/gi
      )
    ];

    if (messageBlocks.length > 0) {
      // Get the last message block
      const lastBlock = messageBlocks[messageBlocks.length - 1];
      const lastBlockIndex = data.lastIndexOf(lastBlock[0]);
      
      // Remove the last message block
      return data.substring(0, lastBlockIndex).trim();
    } 

    return "";
  });
};

// Rewrite the chat history with a new conversation
export const rewriteChatHistory = async (chatFile: TFile, messages: Message[]) => {
  const app = getApp();
  
  // Rewrite the chat file
  await app.vault.process(chatFile, (data) => {
    // Extract thread_id from the original chat
    const threadIdMatch = data.match(/thread_id:\s*(chat-[\w:-]+)/);
    const threadId = threadIdMatch ? threadIdMatch[1] : '';
    
    // Start with thread_id
    let newChat = threadId ? `thread_id: ${threadId}` : '';
    
    // Add all messages
    for (const message of messages) {
      const attachmentsStr = serializeAttachments(message.attachments);
      
      // Serialize tool calls if present
      let toolCallsStr = "";
      if (message.toolCalls && message.toolCalls.length > 0) {
        toolCallsStr = `\n\r**Tool calls:**\n${message.toolCalls.map(tc => `- ${JSON.stringify(tc)}`).join('\n')}`;
      }
      
      newChat += `\n\r**${message.sender.toUpperCase()}**:\n${toolCallsStr}${toolCallsStr ? '\n\r' : ''}${message.content}${attachmentsStr}`;
    }

    return newChat;
  });
};