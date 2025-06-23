import { TFile, Notice } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { getTime } from "src/utils/time";
import { exportMessage, getThreadId, removeLastMessage } from "src/utils/chatHistory";
import { Message, MessageSender } from "src/types/index";
import { Agent } from "src/backend/managers/agentManager";
import { getStructuredSysPrompt } from "src/utils/vaultStructure";

// Class that manage the streaming calls using chains
export class ChatStreamingService {
  private app = getApp();
  
  // Gets and runs a chain
  async startStreaming(
    message: string,
    chatFile: TFile,
    updateConversation: (updater: (prev: Message[]) => Message[]) => void,
    notes: TFile[],
    images: File[],
    isRegeneration: boolean = false
  ) {
    const settings = getSettings();
    const agent = new Agent()

    try {
      // Verify chat file exists
      const fileExists = this.app.vault.getAbstractFileByPath(chatFile.path);
      if (!fileExists) {
        const errorMsg = "Chat file was deleted, please create a new chat";
        new Notice(errorMsg, 5000); 
        if (settings.debug) console.error(errorMsg);
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
          attachments: notes,
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
        attachments: [],
      };
      updateConversation(prev => [...prev, tempBotMessage]);

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

      
      const systemMessage = getStructuredSysPrompt();
      const humanMessage = message;
      const threadId = await getThreadId(chatFile);
      // Execute streaming
      try {
        await agent.generateContent(systemMessage, humanMessage, notes, images, threadId, updateAiMessage);

        // Only export the final message if we received any content
        if (accumulated.trim()) {
          const finalBotMessage: Message = {
            sender: MessageSender.BOT,
            content: accumulated,
            timestamp: getTime(),
            attachments: [],
          };
          await exportMessage(finalBotMessage, chatFile);
        } else {
          const errorMsg = 'No response received from the AI' 
          new Notice(errorMsg, 5000);
          if (settings.debug) console.error(errorMsg);

          // Update conversation with error message
          updateConversation(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: "*No message generated*"
            };
            return updated;
          });

          // Export error message
          const finalBotMessage: Message = {
            sender: MessageSender.BOT,
            content: "*No message generated*",
            timestamp: getTime(),
            attachments: [],
          };
          await exportMessage(finalBotMessage, chatFile);
        }
      } catch (err) {
        const errorMsg = `Error during streaming: ${err}`;
        new Notice(errorMsg, 5000);
        if (settings.debug) console.error(errorMsg);
        throw new Error(errorMsg);
      }

    } catch (err) {
      const errorMsg = `Error during streaming: ${err}`
      new Notice(errorMsg, 5000);
      if (settings.debug) console.error(errorMsg);
    }
  }
}