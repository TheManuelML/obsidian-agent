import { TFile } from "obsidian";
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
        throw new Error("Chat file was deleted, please create a new chat");
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
      await this.handleStreamingError(err, updateConversation, chatFile);
    }
  }

  // Handle error messages
  private async handleStreamingError(
    err: unknown,
    updateConversation: (updater: (prev: Message[]) => Message[]) => void,
    chatFile: TFile
  ) {
    console.error("Error during streaming:", err);
    
    const errorMessage = `❌ ERROR: ${err instanceof Error ? err.message : "Error processing message."}`;
    
    updateConversation(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: errorMessage,
          isErrorMessage: true,
        };
      }
      return updated;
    });

    // Try to save error message
    try {
      const errorBotMessage: Message = {
        sender: MessageSender.BOT,
        content: errorMessage,
        timestamp: getTime(),
        isErrorMessage: true,
      };
      await exportMessage(errorBotMessage, chatFile);
    } catch (exportErr) {
      console.error("Error saving error message:", exportErr);
    }
  }

  resetFirstMessageFlag() {
    this.hasSentFirst = false;
  }
}