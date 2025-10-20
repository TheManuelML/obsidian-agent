import { ToolCall } from "@langchain/core/dist/messages/tool";
import { TFile, Notice } from "obsidian";
import { exportMessage, removeLastMessages } from "src/utils/chatHistory";
import { callAgent } from "src/backend/managers/runner";
import { Attachment, Message } from "src/types/chat";

// This function should call callAgent() and add the new user and bot messages to the History
// And remove all messages that were after the edited user message
export const handleCall = async (
  chat: TFile,
  messageIndex: number | null,
  message: string,
  attachments: Attachment[],
  files: File[],
  conversation: Message[],
  updateConversation: (value: Message[] | ((prev: Message[]) => Message[])) => void,
  isRegeneration: boolean,
) => {
  // If regenerating, remove the messages after the regenerated message
  if (isRegeneration && messageIndex !== null) {
    const length = conversation.length;
    const n = length - 1 - messageIndex;

    if (n > 0) {
      // Remove the last n lines from the chat file
      await removeLastMessages(chat, n);
      // Update the conversation
      updateConversation((prev) => prev.slice(0, prev.length - n));
    }
  }

  // Create the user message
  const userMessage: Message = {
    sender: "user",
    content: message,
    attachments,
    toolCalls: []
  };
  // Update the conversation with this new message
  updateConversation((prev: Message[]) => [...prev, userMessage]);
  // Export the user message into the chat file
  exportMessage(userMessage, chat);

  // Create the agent message
  const tempMessage: Message = {
    sender: "bot",
    content: "",
    attachments: [],
    toolCalls: [],
  };
  // Update the conversation with this temp message
  updateConversation((prev: Message[]) => [...prev, tempMessage]);

  // Start the call to the agent
  // The calls to the agent are in streaming mode
  // We need to update the content of the tmp message
  let accumulatedContent = "";
  let accumulatedToolCalls: ToolCall[] = []
  const updateMessage = (chunk: string, toolCalls: ToolCall[]) => {
    // Add upcoming chunks
    if (chunk) accumulatedContent += chunk;
    
    // Add upcoming toolcalls
    if (toolCalls) accumulatedToolCalls = [...accumulatedToolCalls, ...toolCalls];

    // Update the conversation with the upcoming chunks
    updateConversation((prev: Message[]) => {
      const update = [...prev];

      update[update.length - 1] = {
        ...update[update.length - 1],
        content: accumulatedContent,
        toolCalls: accumulatedToolCalls
      }
      return update;
    });
  };

  // Call
  await callAgent(
    chat,
    message,
    attachments,
    files,
    updateMessage 
  )

  // Check if the agent return something
  if (accumulatedContent.trim()) {
    const botMessage: Message = {
      sender: "bot",
      content: accumulatedContent,
      attachments,
      toolCalls: accumulatedToolCalls,
    };
    // Just export the message, the tmp message is already in the conversation
    exportMessage(botMessage, chat);
  
  } else {
    const errorMsg = "No response recieved from the AI";
    new Notice(errorMsg, 5000);

    // Create an error message to show on the chat, replacing the empty tmp message
    updateConversation((prev: Message[]) => {
      const update = [...prev];

      update[update.length - 1] = {
        ...update[update.length - 1],
        sender: "error",
        content: "*Unable to generate message. Try again later.*",
      }
      return update;
    })

    const errorMessage: Message = {
      sender: "error",
      content: "*Unable to generate message. Try again later.*",
      attachments: [],
      toolCalls: [],
    };
    exportMessage(errorMessage, chat);
  };
}