import { ToolCall } from "@langchain/core/dist/messages/tool";
import { TFile, Notice } from "obsidian";
import { exportMessage, removeMessagesAfterIndexN } from "src/utils/chatHistory";
import { callAgent } from "src/backend/managers/runner";
import { Attachment, Message } from "src/types/chat";
import { getSettings } from "src/plugin";

// This function should call callAgent() and add the new user and bot messages to the History
// And remove all messages that were after the edited user message
export const handleCall = async (
  chat: TFile,
  messageIndex: number | null,
  message: string,
  attachments: Attachment[],
  files: File[],
  updateConversation: (value: Message[] | ((prev: Message[]) => Message[])) => void,
  isRegeneration: boolean,
) => {
  // If regenerating, remove the messages after the regenerated message
  if (isRegeneration && messageIndex !== null) {
    // Rewrites the chat file from messages from 0 to n. If n is 0 empties the chat file
    await removeMessagesAfterIndexN(chat, messageIndex);
    // Update the conversation
    updateConversation((prev) => prev.slice(0, messageIndex));
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
    content: "*Thinking ...*",
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
    if (toolCalls && toolCalls.length) accumulatedToolCalls = [...accumulatedToolCalls, ...toolCalls];

    // Update the conversation with the upcoming chunks
    updateConversation((prev: Message[]) => {
      const update = [...prev];
      const lastIndex = update.length - 1;

      update[lastIndex] = {
        ...update[lastIndex],
        content: accumulatedContent,
        toolCalls: accumulatedToolCalls
      };
      return update;
    });
  };

  // Call
  let callError: string = "";
  try {
    await callAgent(chat, message, attachments, files, updateMessage);
  } catch (error) {
    callError = String(error);
  };

  // Check if the agent return something
  const hasTools = accumulatedToolCalls && accumulatedToolCalls.length > 0;
  const hasMeaningfulContent = accumulatedContent.trim() && accumulatedContent.trim() !== "*Thinking ...*";

  const somethingWentWrong = callError || (!hasMeaningfulContent && !hasTools);

  if (somethingWentWrong) {
    // Clean up the accumulated content and tool calls
    if (callError) {
      const errorMsg = `Error while processing the request: ${callError}`;
      if (getSettings().debug) console.error(errorMsg);
      new Notice (errorMsg, 5000);
      
      accumulatedContent = "";
      accumulatedToolCalls = [];
    }
    
    // Create an error message to show on the chat, replacing the empty tmp message
    const errorMessage: Message = {
      sender: "error",
      content: callError
        ? "*Something went wrong while processing the request.*"
        : "*No answer was generated for the request.*",
      attachments: [],
      toolCalls: [],
    };

    updateConversation((prev: Message[]) => {
      const update = [...prev];
      const lastIndex = update.length - 1;

      update[lastIndex] = errorMessage;
      return update;
    });

    // Export the final bot message to the chat file
    exportMessage(errorMessage, chat);

  } else {
    // Generate message in case the agent only executed tools
    if (!hasMeaningfulContent && hasTools) accumulatedContent = `*Tools executed successfully.*`;

    const botMessage: Message = {
      sender: "bot",
      content: accumulatedContent,
      attachments: [],
      toolCalls: accumulatedToolCalls,
    };

    // Replace the temporary message in the conversation state with the final bot message
    updateConversation((prev: Message[]) => {
      const update = [...prev];
      const lastIndex = update.length - 1;
      update[lastIndex] = botMessage;
      return update;
    });

    // Export the final bot message to the chat file
    exportMessage(botMessage, chat);
  
  };
}