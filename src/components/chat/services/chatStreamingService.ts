import { TFile, Notice } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { getTime } from "src/utils/time";
import { exportMessage, getThreadId, getLastNMessages } from "src/utils/chatHistory";
import { Message, MessageSender } from "src/types/index";
import { ChainManager } from "src/backend/managers/chainManager";
import { ChainRunner } from "src/backend/managers/chainRunner";

// Class that manage the streaming calls using chains
export class ChatStreamingService {
  private app = getApp();
  private settings = getSettings();
  private hasSentFirst = false; // Flag if it is the first time interacting with a chat after a reset

  // Gets and runs a chain
  async startStreaming(
    message: string,
    chatFile: TFile,
    updateConversation: (updater: (prev: Message[]) => Message[]) => void,
    notes?: TFile[],
    images?: File[]
  ) {
    const chain = ChainManager.getInstance().getChain();
    const runner = new ChainRunner();

    try {
      // Verify chat file exists
      const fileExists = this.app.vault.getAbstractFileByPath(chatFile.path);
      if (!fileExists) {
        const errorMsg = "Chat file was deleted, please create a new chat";
        new Notice(errorMsg, 5000); 
        throw new Error(errorMsg);
      }

      // Add user message
      const userMessage: Message = {
        sender: MessageSender.USER,
        content: message,
        timestamp: getTime(),
      };
      
      updateConversation(prev => [...prev, userMessage]);

      // Export user message
      await exportMessage(userMessage, chatFile);

      // Add placeholder AI message
      const tempBotMessage: Message = {
        sender: MessageSender.BOT,
        content: "",
        timestamp: getTime(),
      };
      updateConversation(prev => [...prev, tempBotMessage]);

      // Get context if first message
      if (!this.hasSentFirst) {
        await getLastNMessages(chatFile, this.settings.amountOfMessagesInMemory * 2);
        this.hasSentFirst = true;
      }

      // Setup streaming
      let accumulated = "";
      let hasReceivedFirstChunk = false;

      const updateAiMessage = (chunk: string) => {
        if (!hasReceivedFirstChunk) {
          hasReceivedFirstChunk = true;
        }
        
        accumulated += chunk;
        
        updateConversation(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: accumulated
          };
          return updated;
        });
      };

      // Execute streaming
      const threadId = await getThreadId(chatFile);
      await runner.run(chain, threadId, userMessage, notes, images, updateAiMessage);

      // Export final message
      const finalBotMessage: Message = {
        sender: MessageSender.BOT,
        content: accumulated,
        timestamp: getTime(),
      };
      await exportMessage(finalBotMessage, chatFile);

    } catch (err) {
      new Notice(err as string, 5000);
    }
  }
}