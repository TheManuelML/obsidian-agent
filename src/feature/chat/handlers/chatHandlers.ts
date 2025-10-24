import { TFile, TFolder, Notice } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { formatTagsForChat } from "src/utils/notes/tags";
import { getTime, getTimeId } from "src/utils/formatting/timeFormat";

// Create the chat folder
async function createChatFolder(): Promise<TFolder | null> {
  const app = getApp();
  const settings = getSettings();
  
  try {
    return await app.vault.createFolder(settings.chatsFolder);
  
  } catch (error) {
    const errorMsg = "Error creating chat folder: " + error;
    new Notice(errorMsg, 5000);
    if (settings.debug) console.error(errorMsg);
  }

  return null;
};

// Create a new chat file
async function createNewChatFile(folder: TFolder): Promise<TFile  | null> {
  const app = getApp();
  const settings = getSettings();

  const timestamp = getTimeId();
  const chatFileName = `chat-${timestamp}.md`;
  const chatFilePath = `${folder.path}/${chatFileName}`;
  
  const tags = formatTagsForChat(getTime(), chatFileName.replace('.md', ''));

  try {
    return await app.vault.create(chatFilePath, tags);
  
  } catch (error) {
    const errorMsg = "Error creating chat file: " + error;
    new Notice(errorMsg, 5000);
    if (settings.debug) console.error(errorMsg);
  }

  return null;
};

// Load the existing chat files in the chat folder
async function loadChatFiles(folder: TFolder): Promise<TFile[]> {
  const app = getApp();
  const settings = getSettings();

  try {
    const files = app.vault.getFiles().filter(file => 
      file.path.startsWith(folder.path) && file.extension === 'md'
    );
    return files;

  } catch (error) {
    const errorMsg = "Error loading files from the chat folder: " + error;
    new Notice(errorMsg, 5000);
    if (settings.debug) console.error(errorMsg);
  }

  return [];
};


// Handles the creation of a chat and refresh the list of available chats
export const handleCreateChat = async () => {
  const app = getApp();
  const settings = getSettings();

  let availableChats: TFile[] = [];
  let activeChat: TFile | null = null;

  let chatFolder: TFolder | null = app.vault.getFolderByPath(settings.chatsFolder);
  if (!chatFolder) chatFolder = await createChatFolder();
  // If unable to create a folder a Notice will raise
  if (!chatFolder) return { activeChat, availableChats };

  activeChat = await createNewChatFile(chatFolder);
  availableChats = await loadChatFiles(chatFolder);
  if (activeChat) return { activeChat, availableChats };
  // If unable to create a new chat and refresh the list of available chats a Notice will raise
  return { activeChat, availableChats };
};


// Handles the deletion of a chat and refresh the list of available chats
export const handleDeleteChat = async (activeChat: TFile, availableChats: TFile[]) => {
  const app = getApp();
  const settings = getSettings();

  // Open chat folder
  let chatFolder: TFolder | null = app.vault.getFolderByPath(settings.chatsFolder);
  if (!chatFolder) {
    const errorMsg = "Cannot delete, no chat folder found";
    new Notice(errorMsg, 5000);
    return { activeChat, availableChats };
  }

  // Verify the file still exists before trying to delete it
  const fileToDelete = app.vault.getFileByPath(activeChat.path);
  if (!fileToDelete) {
    const errorMsg = "Chat file no longer exists";
    new Notice(errorMsg, 5000);
    
    const updatedChats = await loadChatFiles(chatFolder);
    if (updatedChats.length > 0) return { activeChat: updatedChats[0], availableChats: updatedChats };
    // If no files remain ensure there is an active chat
    return await ensureActiveChat();
  }
  await app.fileManager.trashFile(fileToDelete);

  // Get updated chat files after deletion
  const updatedChats = await loadChatFiles(chatFolder);
  if (updatedChats.length > 0) return { activeChat: updatedChats[0], availableChats: updatedChats };
  // If no files remain ensure there is an active chat
  return await ensureActiveChat();
}

// Check if there is an active chat, if not creates one
export const ensureActiveChat = async () => {
  const app = getApp();
  const settings = getSettings();

  let availableChats: TFile[] = [];
  let activeChat: TFile | null = null;
  
  let chatFolder: TFolder | null = app.vault.getFolderByPath(settings.chatsFolder);
  if (!chatFolder) chatFolder = await createChatFolder();
  if (!chatFolder) return { activeChat, availableChats };
  
  availableChats = await loadChatFiles(chatFolder);
  if (availableChats.length > 0) {
    // Get the last changed chat file
    activeChat = availableChats.sort((a, b) => b.stat.mtime - a.stat.mtime)[0];
    return { activeChat, availableChats };
  }

  // If there are no files create a new one
  activeChat = await createNewChatFile(chatFolder);
  if (activeChat) {
    availableChats = await loadChatFiles(chatFolder);
    return { activeChat, availableChats }
  }

  return { activeChat, availableChats };
};