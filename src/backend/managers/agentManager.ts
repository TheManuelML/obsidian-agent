import { createAgent, ReactAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createNote, editNote, readNote } from "src/backend/tools/obsidianFiles";
import { createDir, listFiles } from "src/backend/tools/obsidianDirs";
import { vaultSearch } from "src/backend/tools/obsidianSearch";
import { noteFiltering } from "../tools/obsidianFilter";
import { webSearch } from "src/backend/tools/webSearch";
import { MemoryManager } from "src/backend/managers/memoryManager";
import { ModelManager } from "src/backend/managers/modelManager";

// Manage the creation and update of the agent
export class AgentManager {
  private static instance: AgentManager;
  private agent?: ReactAgent;
  private model?: ChatGoogleGenerativeAI;
  private memorySaver?: MemorySaver;

  private constructor() {
    // Set required values
    this.setModel()
    this.setMemory()
    // Creates the chain
    this.agent = this.createAgent();
  }

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager;
    }
    return AgentManager.instance;
  }

  // Set the model of the actual settings
  private setModel() {
    this.model = ModelManager.getInstance().getModel();
  }

  // Set the memory saver
  private setMemory() {
    this.memorySaver = MemoryManager.getInstance().getMemorySaver();
  }

  // Create the agent
  private createAgent(): ReactAgent {
    if (!this.model || !this.memorySaver) {
      throw new Error("Model or memory not set");
    }

    return createAgent({
      model: this.model,
      checkpointer: this.memorySaver,
      tools: [
        createNote,
        readNote,
        editNote,
        createDir,
        listFiles,
        vaultSearch,
        noteFiltering,
        webSearch,
      ]
    });
  }

  public getAgent(): ReactAgent {
    // Update the model (it might have chaged)
    this.setModel()
    // Create the agent, a new one per call
    this.agent = this.createAgent()
    return this.agent;
  }
}