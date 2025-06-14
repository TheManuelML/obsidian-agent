import { useState } from "react";
import { TFile, TFolder, Notice } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { formatTagsForChat } from "src/utils/formating";
import { getTime, getTimeId } from "src/utils/time";
import { importConversation } from "src/utils/chatHistory";
import { Message } from "src/types/index";

// Manage the creation of chatFiles and chatFolders
export const useChatFile = () => {
  const app = getApp();
  const settings = getSettings();
  
  const [chatFile, setChatFile] = useState<TFile | null>(null);
  const [chatFiles, setChatFiles] = useState<TFile[]>([]);
  const [conversation, setConversation] = useState<Message[]>([]);

  // Refresh the existing chat files
  const loadChatFiles = async (): Promise<TFile[]> => {
    const chatFolder = app.vault.getFolderByPath(settings.chatsFolder);
    if (!chatFolder) return [];

    const files = app.vault.getFiles().filter(file => 
      file.path.startsWith(chatFolder.path) && file.extension === 'md'
    );
    setChatFiles(files);
    return files;
  };

  // Create the chat folder
  const createChatFolder = async (): Promise<TFolder | null> => {
    try {
      return await app.vault.createFolder(settings.chatsFolder);
    } catch (err) {
      const errorMsg = "Error creating chat folder: " + err;
      new Notice(errorMsg, 5000);
      if (settings.debug) console.error(errorMsg);
      
      return null;
    }
  };

  // Create a new chat file
  const createNewChatFile = async (folder: TFolder): Promise<TFile | null> => {
    const timestamp = getTimeId();
    const chatFileName = `chat-${timestamp}.md`;
    const chatFilePath = `${folder.path}/${chatFileName}`;
    
    const tags = formatTagsForChat(getTime(), chatFileName.replace('.md', ''));

    try {
      return await app.vault.create(chatFilePath, tags);
    } catch (err) {
      const errorMsg = "Error creating chat file: " + err;
      new Notice(errorMsg, 5000);
      if (settings.debug) console.error(errorMsg);

      return null;
    }
  };

  // Handle the creation of a chat
  const handleCreateChat = async () => {
    let chatFolder: TFolder | null = app.vault.getFolderByPath(settings.chatsFolder);
    if (!chatFolder) {
      chatFolder = await createChatFolder();
      if (!chatFolder) return;
    }

    const newFile = await createNewChatFile(chatFolder);
    if (newFile) {
      setChatFile(newFile);
      await loadChatFiles();
      setConversation([]);
    }
  };

  // Ensures there is an active chat
  const ensureActiveChat = async (): Promise<TFile | null> => {
    if (chatFile) return chatFile;
    
    let chatFolder: TFolder | null = app.vault.getFolderByPath(settings.chatsFolder);
    if (!chatFolder) {
      chatFolder = await createChatFolder();
      if (!chatFolder) return null;
    }

    await loadChatFiles();
    const existing = chatFiles.length > 0 ? chatFiles : await loadChatFiles();
    
    if (existing.length > 0) {
      const mostRecentChat = existing.sort((a, b) => b.stat.mtime - a.stat.mtime)[0];
      setChatFile(mostRecentChat);
      setConversation(await importConversation(mostRecentChat));
      return mostRecentChat;
    }

    const newFile = await createNewChatFile(chatFolder);
    if (newFile) {
      setChatFile(newFile);
      await loadChatFiles();
      setConversation([]);
    }
    return newFile;
  };

  return {
    chatFile,
    setChatFile,
    chatFiles,
    conversation,
    setConversation,
    loadChatFiles,
    handleCreateChat,
    ensureActiveChat
  };
};