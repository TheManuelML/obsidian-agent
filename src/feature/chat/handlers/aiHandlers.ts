import { TFile, Notice } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { 
  exportMessage, 
  removeMessagesAfterIndexN, 
  removeLastNMessages, 
  importConversation,
} from "src/utils/chat/chatHistory";
import { callAgent } from "src/backend/managers/agentRunner";
import { callModel } from "src/backend/managers/modelRunner";
import { Attachment, Message, ToolCall } from "src/types/chat";


// This function call callAgent and writes the new user and bot messages to the obsidian chat file 
// If you are regenerating a message this will remove all messages that were generated after the regenerated user message
export const handleCall = async (
  chat: TFile,
  messageIndex: number | null,
  message: string,
  attachments: Attachment[],
  files: File[],
  updateConversation: (value: Message[] | ((prev: Message[]) => Message[])) => void,
  isRegeneration: boolean,
) => {
  const settings = getSettings();

  // If regenerating, remove the messages after the regenerated message
  if (isRegeneration && messageIndex !== null) {
    // Rewrites the chat file from messages from 0 to n. If n is 0 empties the chat file
    await removeMessagesAfterIndexN(chat, messageIndex);
    // Update the conversation
    updateConversation((prev) => prev.slice(0, messageIndex));
  }

  // If is the first message, generate a name for the chat file
  if (settings.generateChatName && !isRegeneration) {
    const conversation = await importConversation(chat);
    if (conversation.length === 0) {
      const app = getApp();
  
      const newName = await generateChatFileName(message, files);
      if (newName) {
        const newPath = chat.parent?.path + "/" + newName + ".md";
  
        await app.vault.rename(chat, newPath);
        chat = app.vault.getFileByPath(newPath)!;
      };
    }
  }

  // Get the conversation before adding the new messages
  const conversation = await importConversation(chat);

  // Create the user message
  const userMessage: Message = {
    sender: "user",
    content: message,
    reasoning: "",
    attachments,
    toolCalls: [],
    processed: false,
  };
  // Update the conversation with this new message
  updateConversation((prev: Message[]) => [...prev, userMessage]);
  // Export the user message into the chat file
  exportMessage(userMessage, chat);

  // Create the model message
  const tempMessage: Message = {
    sender: "bot",
    content: "",
    reasoning: "",
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
  let accumulatedReasoning = "";
  let accumulatedToolCalls: ToolCall[] = []
  const updateMessage = (chunk: string, reasoning: string, toolCalls: ToolCall[]) => {
    // Add upcoming chunks
    if (chunk) accumulatedContent += chunk;
    
    // Add reasoning chunks
    if (reasoning) accumulatedReasoning += `\n\n*${reasoning}*`;

    // Add upcoming toolcalls
    if (toolCalls && toolCalls.length > 0) accumulatedToolCalls = [...accumulatedToolCalls, ...toolCalls];

    // Update the conversation with the upcoming chunks
    updateConversation((prev: Message[]) => {
      const update = [...prev];
      const lastIndex = update.length - 1;

      update[lastIndex] = {
        ...update[lastIndex],
        content: accumulatedContent,
        reasoning: accumulatedReasoning,
        toolCalls: accumulatedToolCalls
      };
      return update;
    });
  };

  // Call
  let callError: string = "";
  try {
    await callAgent(conversation, message, attachments, files, updateMessage);
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
      if (getSettings().debug) console.error(callError);
      new Notice (callError, 5000);
      
      accumulatedContent = "";
    }
    
    // Create an error message to show on the chat, replacing the empty tmp message
    errorMessage = {
      sender: "error",
      content: callError ? 
        `${accumulatedContent}\n*Something went wrong while processing the request.*` : 
        "*No answer was generated for the request.*",
      reasoning: accumulatedReasoning,
      attachments: [],
      toolCalls: accumulatedToolCalls,
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
      reasoning: accumulatedReasoning,
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
  const newName = await callModel(
    "You have the task of generating a title for a user-bot chat based on the user message provided to you. The title should be short and descriptive, no more than four words.",
    userMessage,
    images,
  );

  const cleanedName = newName
  .replace(/[*"\\/<>:|?]/g, "")
  .trim();
  
  return cleanedName;
}
