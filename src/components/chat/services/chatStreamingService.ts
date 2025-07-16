import { TFile, Notice } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { exportMessage, getThreadId, removeLastMessage } from "src/utils/chatHistory";
import { Message, MessageSender, ToolCall } from "src/types/index";
import { AgentManager } from "src/backend/managers/agentManager";
import { AgentRunner } from "src/backend/managers/agentRunner";

// Class that manage the streaming calls using chains
export class ChatStreamingService {
  private app = getApp();

  // Gets and runs a chain
  async startStreaming(
    message: string,
    chatFile: TFile,
    updateConversation: (updater: (prev: Message[]) => Message[]) => void,
    notes: TFile[],
    files: File[],
    isRegeneration: boolean = false
  ) {
    const settings = getSettings();
    let chain;
    try {
      chain = AgentManager.getInstance().getAgent();
    } catch (err) {
      const errorMsg = `Error initializing chat: ${err}`;
      new Notice(errorMsg, 5000);
      if (settings.debug) console.error(errorMsg);
      return;
    }

    const runner = new AgentRunner();

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
          attachments: notes,
          toolCalls: []
        };
        updateConversation(prev => [...prev, userMessage]);

        // Export user message
        await exportMessage(userMessage, chatFile);
      }

      // Add placeholder AI message
      const tempBotMessage: Message = {
        sender: MessageSender.BOT,
        content: "",
        attachments: [],
        toolCalls: []
      };
      updateConversation(prev => [...prev, tempBotMessage]);

      // Setup streaming
      let accumulated = "";
      let hasReceivedFirstChunk = false;
      let acumulatedToolCalls: ToolCall[] = []; 

      const updateAiMessage = (chunk: string, toolCalls?: any[]) => {
        if (!hasReceivedFirstChunk) {
          hasReceivedFirstChunk = true;
        }
        
        accumulated += chunk;

        // Accumulate tool calls
        if (toolCalls && toolCalls.length > 0) {
          acumulatedToolCalls = [...acumulatedToolCalls, ...toolCalls];
        }
        
        updateConversation(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: accumulated,
            toolCalls: acumulatedToolCalls.length > 0 ? acumulatedToolCalls : []
          };
          return updated;
        });
      };

      // Execute streaming
      const threadId = await getThreadId(chatFile);
      try {
        await runner.run(
          chain, 
          threadId, 
          { content: message, sender: MessageSender.USER, attachments: notes, toolCalls: acumulatedToolCalls.length > 0 ? acumulatedToolCalls : [] }, 
          notes, 
          files, 
          updateAiMessage
        );

        // Only export the final message if we received any content
        if (accumulated.trim()) {
          const finalBotMessage: Message = {
            sender: MessageSender.BOT,
            content: accumulated,
            attachments: notes,
            toolCalls: acumulatedToolCalls.length > 0 ? acumulatedToolCalls : []
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
            attachments: [],
            toolCalls: []
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