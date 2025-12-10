import { ToolCall } from "langchain";
import { TFile, Notice } from "obsidian";
import { exportMessage, removeMessagesAfterIndexN, removeLastNMessages, importConversation } from "src/utils/chat/chatHistory";
import { callAgent } from "src/backend/managers/agentRunner";
import { callModel } from "src/backend/managers/modelRunner";
import { Attachment, Message } from "src/types/chat";
import { getApp, getSettings } from "src/plugin";
import { imageToBase64 } from "src/utils/parsing/imageBase64";


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

  // If is the first message, generate a name for the chat file
  const settings = getSettings();
  if (settings.generateChatName) {
    const conversation = await importConversation(chat);
    if (conversation.length === 0) {
      const app = getApp();
  
      const newName = await generateChatFileName(message, files);
      const newPath = chat.parent?.path + "/" + newName + ".md";
  
      await app.vault.rename(chat, newPath);
      chat = app.vault.getFileByPath(newPath)!;
    }
  }

  // Create the user message
  const userMessage: Message = {
    sender: "user",
    content: message,
    attachments,
    toolCalls: [],
    processed: false,
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
    processed: false,
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
  
  const somethingWentWrong = callError || (!accumulatedContent.trim() && !hasTools);

  let botMessage: Message | null = null;
  let errorMessage: Message | null = null;
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
    errorMessage = {
      sender: "error",
      content: callError
        ? "*Something went wrong while processing the request.*"
        : "*No answer was generated for the request.*",
      attachments: [],
      toolCalls: [],
      processed: true,
    };

    updateConversation((prev: Message[]) => {
      const update = [...prev];
      const lastIndex = update.length - 1;

      update[lastIndex] = errorMessage!;
      return update;
    });

    // Export the final bot message to the chat file
    exportMessage(errorMessage, chat);

  } else {
    // Generate message in case the agent only executed tools
    if (!accumulatedContent.trim() && hasTools) accumulatedContent = `*Tools executed successfully.*`;

    botMessage = {
      sender: "bot",
      content: accumulatedContent,
      attachments: [],
      toolCalls: accumulatedToolCalls,
      processed: true,
    };

    // Replace the temporary message in the conversation state with the final bot message
    updateConversation((prev: Message[]) => {
      const update = [...prev];
      const lastIndex = update.length - 1;
      update[lastIndex] = botMessage!;
      return update;
    });

    // Export the final bot message to the chat file
    exportMessage(botMessage, chat);
  };

  // Access the user message and change the processed flag to true
  updateConversation((prev: Message[]) => {
    const update = [...prev];
    
    const userMessageIndex = isRegeneration && messageIndex !== null
      ? messageIndex
      : update.findLastIndex((m) => m.sender === "user");

    update[userMessageIndex] = {
      ...update[userMessageIndex],
      processed: true,
    };
    return update;
  });

  // Remove the user and bot/error messages and rewrite the user message with the porcessed flag set to true
  await removeLastNMessages(chat, 2);

  userMessage.processed = true;
  exportMessage(userMessage, chat);
  
  if (errorMessage !== null) {
    exportMessage(errorMessage, chat);
  } else if (botMessage !== null ){
    exportMessage(botMessage, chat);
  }
}

// Function that generates a name for a chat file
async function generateChatFileName(userMessage: string, images: File[]) {
  const base64Images: {
    base64: string, 
    mimeType: "image/png" | "image/jpeg"
  }[] = [];
  
  for (const image of images) {
    const base64 = await imageToBase64(image);
    base64Images.push({
      base64: base64,
      mimeType: image.type === "image/png" ? "image/png" : "image/jpeg",
    });
  }

  const newName = await callModel(
    "You have the task of generating a title for a user-bot chat based on the user message provided to you. The title should be short and descriptive, no more than four words.",
    userMessage,
    base64Images,
  )

  return newName;
}