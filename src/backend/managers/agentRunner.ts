import {
  GoogleGenAI,
  GoogleGenAIOptions,
  GenerateContentConfig,
  GenerateContentResponse,
  Chat,
  Content,
  Part,
  SafetySetting, 
  HarmCategory, 
  HarmBlockThreshold,
  ApiError,
  ThinkingLevel,
} from "@google/genai";
import { getSettings } from "src/plugin";
import { Message, Attachment, ToolCall } from "src/types/chat";
import { prepareModelInputs, buildChatHistory } from "src/backend/managers/prompts/inputs";
import { agentSystemPrompt } from "src/backend/managers/prompts/library";  
import { callableFunctionDeclarations, executeFunction } from "src/backend/managers/functionRunner";
import { DEFAULT_SETTINGS } from "src/settings/SettingsTab";


// Function that calls the agent with chat history and tools binded
export async function callAgent(
  conversation: Message[],
  message: string,
  attachments: Attachment[],
  files: File[],
  updateAiMessage: (m: string, r: string, t: ToolCall[]) => void,
): Promise<void> {
  const settings = getSettings();

  // Initialize model and its configuration
  const config: GoogleGenAIOptions = { apiKey: settings.googleApiKey, apiVersion: "v1beta" };
  const ai = new GoogleGenAI(config);

  const safetySettings: SafetySetting[] = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  const generationConfig: GenerateContentConfig = {
    systemInstruction: agentSystemPrompt,
    safetySettings: safetySettings,
    thinkingConfig: {
      includeThoughts: true,
    },
    tools: [{
      functionDeclarations: callableFunctionDeclarations,
    }]
  };
  // Special settings for Gemini 3 models
  if (settings.model.includes("3") && settings.thinkingLevel !== DEFAULT_SETTINGS.thinkingLevel) {
    generationConfig.thinkingConfig!.thinkingLevel = settings.thinkingLevel === "Low" 
      ? ThinkingLevel.LOW 
      : ThinkingLevel.HIGH;
  }
  if (settings.temperature !== DEFAULT_SETTINGS.temperature) {
    generationConfig.temperature = Number(settings.temperature);
  }
  if (settings.maxOutputTokens !== DEFAULT_SETTINGS.maxOutputTokens) {
    generationConfig.maxOutputTokens = Number(settings.maxOutputTokens);
  }

  // Build chat
  const chatHistory = conversation.length > 0 ? await buildChatHistory(conversation) : [];  
  const chat: Chat = ai.chats.create({
    model: settings.model,
    history: chatHistory,
    config: generationConfig,
  });

  // Prepare user inputs
  let fullUserMessage: string = message;
  if (attachments.length > 0) {
    fullUserMessage += `\n###\nAttached Obsidian notes: `
    for (const note of attachments) {
      fullUserMessage += `\n${note.path}`;
    }
    fullUserMessage += `\n###\n`
  }
  const input: Part[] = await prepareModelInputs(fullUserMessage, files);
  
  const executedFunctionIds = new Set<string>();
  await sendMessageToChat(
    1, 
    ai,
    settings.model,
    generationConfig,
    chat, 
    chatHistory,
    input, 
    updateAiMessage, 
    executedFunctionIds
  );
}


// Sends the message to the chat history and process the response
async function sendMessageToChat(
  turn: number,
  ai: GoogleGenAI,
  model: string,
  generationConfig: GenerateContentConfig,
  chat: Chat,
  originalHistory: Content[],
  input: Part[], 
  updateAiMessage: (m: string, r: string, t: ToolCall[]) => void,
  executedFunctionIds: Set<string>,
): Promise<void> {
  if (turn > 5) {
    throw new Error("Maximum tool execution depth reached. This maximum number of turns is set to avoid infinite loops.");
  }

  try {
    const stream = await chat.sendMessageStream({ message: input });

    // Prcess response
    for await (const chunk of stream) {
      // Manage reasoning
      let allThoughs: string[] = [];
      const candidates = chunk.candidates || [];

      if (chunk.candidates) {
        for (const cand of candidates) {
          const parts = cand.content?.parts || [];
          for (const part of parts) {
            if (part.thought && part.text) {
              allThoughs.push(part.text);
            }
          }
        }
      }

      // Update the message with the chunk
      updateAiMessage(chunk.text || "", allThoughs.join("\n"), []);
    
      // Execute function calls if any
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        await manageFunctionCall(turn, ai, model, generationConfig, originalHistory, input, chunk, updateAiMessage, executedFunctionIds);
        continue;
      }
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw new Error("API quota exceeded. Please check your Google Cloud account.");
      if (error.status === 503) throw new Error("API service overloaded. Please try again later.");
      throw new Error(`API Error: ${error.message}`);
    }
    throw new Error(`Unexpected Error: ${String(error)}`);
  }
}


// Execute the function with the provided arguments and return the responses to the agent
async function manageFunctionCall(
  turn: number,
  ai: GoogleGenAI,
  model: string,
  generationConfig: GenerateContentConfig,
  originalHistory: Content[],
  userInput: Part[],
  chunk: GenerateContentResponse,
  updateAiMessage: (m: string, r: string, t: ToolCall[]) => void,
  executedFunctionIds: Set<string>,
): Promise<void> {
  const settings = getSettings();

  if (!chunk.candidates || chunk.candidates.length === 0) return;
  const cand = chunk.candidates[0];
  if (!cand) return;
    
  // Extract function call
  const parts: Part[] = cand.content?.parts || [];
  const fcParts = parts.filter(p => !!p.functionCall);
  if (fcParts.length === 0) return;

  // One function execution at a time
  const fcPartCandidate = fcParts[0];
  const funcCall = fcPartCandidate.functionCall!;
  if (!funcCall || !funcCall.name) return;

  // Add executed function data to avoid double executions (this calls do not have id property)
  const fId = funcCall.name + JSON.stringify(funcCall.args || {});
  if (executedFunctionIds.has(fId)) return;
  executedFunctionIds.add(fId);
    
  const response = await executeFunction(funcCall);

  // Update the AI message with the function response
  updateAiMessage("", "", [{
    name: funcCall.name,
    args: funcCall.args,
    response: response,
  }]);

  // Create input parts
  const functionResponsePart: Part = {
    functionResponse: {
      name: funcCall.name,
      response: response,
    }
  };

  // The model function call Content
  const modelContent: Content = cand.content!;
  const userContent: Content = {
    role: "user",
    parts: userInput,
  };
  // Update chat history, keeping the length to a maximum of settings.maxTurns
  if (originalHistory.length === settings.maxHistoryTurns*2) {
    if (settings.maxHistoryTurns === 0) {
      originalHistory = [];
    } else {
      originalHistory.shift();
    }
  }
  const newHistory = [...originalHistory, userContent, modelContent];

  // Create a new chat with the updated history
  const newChat: Chat = ai.chats.create({
    model: model,
    history: newHistory,
    config: generationConfig,
  })

  const nextInput: Part[] = [ functionResponsePart ]

  // Call again the agent with the newHistory
  await sendMessageToChat(
    turn+1, 
    ai, 
    model, 
    generationConfig, 
    newChat, 
    newHistory, 
    nextInput, 
    updateAiMessage, 
    executedFunctionIds
  );
}
