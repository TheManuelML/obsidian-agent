import { ToolCall } from "@langchain/core/dist/messages/tool";
import { AIMessageChunk, ToolMessage } from "@langchain/core/messages";
import { TFile } from "obsidian";
import { imageToBase64 } from "./prompts/images";
import { getThreadId } from "src/utils/chatHistory";
import { AgentManager } from "src/backend/managers/agentManager";
import { agentSystemPrompt } from "src/backend/managers/prompts/library";
import { AiMessageInput } from "src/types/ai";
import { Attachment } from "src/types/chat";
import { getSettings } from "src/plugin";

// Function that calls the agent
export async function callAgent(
  chat: TFile, 
  message: string,
  attachments: Attachment[],
  files: File[],
  updateAiMessage: (m: string, t: ToolCall[]) => void,
) {
  // Get the instance of the agent
  let agent = AgentManager.getInstance().getAgent();
  const threadId = await getThreadId(chat);
  const config = {"configurable": {"thread_id": threadId}, "streamMode": "messages"}

  // Add the attachment paths to the user prompt
  let fullUserMessage: string = message;
  if (attachments) {
    fullUserMessage += `\n###\nRead the following Obsidian notes before asnwering: `
    
    for (const note of attachments) fullUserMessage += `\n${note.path}`;

    fullUserMessage += `\n###\n`
  }

  // Prepare the input for the call
  let input: AiMessageInput;
  let base64Images: string[] = [];
  if (files) {
    for (const img of files) base64Images.push(await imageToBase64(img))
  }
  input = await prepareInputs(agentSystemPrompt, fullUserMessage, base64Images);

  // Call
  const stream = await agent.stream(input, config);
  
  // Process chunks
  for await (const chunk of stream) {
    // Trasnform single chunk into array
    const items = chunk instanceof AIMessageChunk ? [chunk]: chunk;
    
    for (const item of items) {
      if (item instanceof AIMessageChunk) {
        const newMessageContent = item.content.toString();
        
        updateAiMessage(newMessageContent, []);
      }

      if (item instanceof ToolMessage) {
        const toolCall: ToolCall[] = [{
          id: item.id,
          name: item.name!.toString(),
          args: JSON.parse(item.content.toString()),
          type: "tool_call",
        }]

        updateAiMessage("", toolCall);
      }
    }
  }
}

// Function that prepare the prompts into inputs for the agent
async function prepareInputs(
  systemPrompt: string,
  userPrompt: string,
  filesBase64?: string[],
) {
  const settings = getSettings();

  // Join system and user prompt (Gemini cannot process them separately)
  const unifiedPrompt = `
    <System>
    ${systemPrompt}
    </System>

    <User>
    ${userPrompt}
    </User>

    ${settings.rules.trim() && (`
    <Important>
    ${settings.rules}
    </Important>
    `)}
  `.trim();
        
  // Prepare the input for text only call
  const inputs: AiMessageInput = { 
    messages: [ {"role": "user", "content": [ { "type": "text", "text": unifiedPrompt } ]} ] 
  };

  // If files add images for a multimodal call
  if (filesBase64) {
    const content = inputs.messages[0].content;
    for (const f64 of filesBase64) {
      content.push({ type: "image_url", image_url: { "url": f64 } });
    }
  }

  return inputs
}