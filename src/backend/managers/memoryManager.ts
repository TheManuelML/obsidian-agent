import { MemorySaver } from "@langchain/langgraph";

// Class that creates and cleans a singleton memory
export class MemoryManager {
  private static instance: MemoryManager;
  private memorySaver: MemorySaver;

  private constructor() {
    this.memorySaver = this.createMemorySaver();
  }

  // Gets the instance of the singleton
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private createMemorySaver(): MemorySaver {
    return new MemorySaver();
  }

  public getMemorySaver(): MemorySaver {
    return this.memorySaver;
  }

  public clearMemory(): void {
    this.memorySaver = this.createMemorySaver();
    console.log("Memory cleared.");
  }
}
