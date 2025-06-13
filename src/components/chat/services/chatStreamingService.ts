import { TFile, Notice } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { getTime } from "src/utils/time";
import { exportMessage, getThreadId, getLastNMessages, removeLastMessage } from "src/utils/chatHistory";
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
    images?: File[],
    isRegeneration: boolean = false
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

      // If regenerating, remove the last bot message from chat history
      if (isRegeneration) {
        await removeLastMessage(chatFile);
      }

      // Add user message only if not regenerating
      if (!isRegeneration) {
        const userMessage: Message = {
          sender: MessageSender.USER,
          content: message,
          timestamp: getTime(),
        };
        updateConversation(prev => [...prev, userMessage]);

        // Export user message
        await exportMessage(userMessage, chatFile);
      }

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
      try {
        await runner.run(chain, threadId, { content: message, sender: MessageSender.USER, timestamp: getTime() }, notes, images, updateAiMessage);

        // Only export the final message if we received any content
        if (accumulated.trim()) {
          const finalBotMessage: Message = {
            sender: MessageSender.BOT,
            content: accumulated,
            timestamp: getTime(),
          };
          await exportMessage(finalBotMessage, chatFile);
        } else {
          new Notice("No response received from the AI", 5000);

          // Export an empty message
          const finalBotMessage: Message = {
            sender: MessageSender.BOT,
            content: "*No message generated*",
            timestamp: getTime(),
          };
          await exportMessage(finalBotMessage, chatFile);
        }
      } catch (err) {
        const errorMsg = "Error during streaming: " + err;
        new Notice(errorMsg, 5000);
        throw new Error(errorMsg);
      }

    } catch (err) {
      new Notice(err as string, 5000);
    }
  }
}