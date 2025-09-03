import { useEffect } from "react";
import { TFile } from "obsidian";
import { getApp } from "src/plugin";
import { importConversation } from "src/utils/chatHistory";
import { Message } from "src/types/index";

// Monitor chat files
export const useChatFileMonitor = (
  chatFile: TFile | null,
  setChatFile: (file: TFile | null) => void,
  setConversation: (conversation: Message[]) => void,
  loadChatFiles: () => Promise<TFile[]>
) => {
  const app = getApp();

  // Every few seconds check if the chat still exists
  useEffect(() => {
    const checkChatFile = async () => {
      if (!chatFile) return;

      const fileExists = app.vault.getAbstractFileByPath(chatFile.path);
      if (!fileExists) {
        const updatedChats = await loadChatFiles();
        if (updatedChats.length > 0) {
          setChatFile(updatedChats[0]);
          setConversation(await importConversation(updatedChats[0]));
        } else {
          setChatFile(null);
          setConversation([]);
        }
      }
    };

    checkChatFile();
    const interval = setInterval(checkChatFile, 2000);
    return () => clearInterval(interval);
  }, [chatFile, setChatFile, setConversation, loadChatFiles]);
};