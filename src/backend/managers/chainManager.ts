import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { LanguageModelLike } from "@langchain/core/language_models/base";
import { Runnable } from "@langchain/core/runnables";
import { createNote, editNote, readNote } from "src/backend/tools/obsidian_files";
import { createDir, listFiles } from "src/backend/tools/obsidian_dirs";
import { search } from "src/backend/tools/obsidian_search";
import { rename } from "src/backend/tools/obsidian_rename";
import { MemoryManager } from "src/backend/managers/memoryManager";
import { ModelManager } from "src/backend/managers/modelManager";

// Manage the creation and update of the chain
export class ChainManager {
    private static instance: ChainManager;
    private chain?: Runnable;
    private model?: LanguageModelLike;
    private memorySaver?: MemorySaver;
    
    private constructor() {
        // Set required values
        this.setModel()
        this.setMemory()
        // Creates the chain
        this.chain = this.createChain();
    }

    static getInstance(): ChainManager {
        if (!ChainManager.instance) {
            ChainManager.instance = new ChainManager;
        }
        return ChainManager.instance;
    }

    // Set the model of the actual settings
    private setModel() {
        this.model = ModelManager.getInstance().getModel();
    }

    // Set the memory saver
    private setMemory() {
        this.memorySaver = MemoryManager.getInstance().getMemorySaver();
    }

    // Create the agent/chain
    private createChain(): Runnable {
        if (!this.model || !this.memorySaver) {
            throw new Error("Model or memory not set");
        }

        return createReactAgent({
            llm: this.model,
            checkpointSaver: this.memorySaver,
            tools: [
                createNote,
                readNote,
                editNote,
                createDir,
                listFiles,
                search,
                rename,
            ]
        });
    }

    public getChain(): Runnable {
        // Update the model (it might have chaged)
        this.setModel()
        // Create the chain, a new one per call
        this.chain = this.createChain()
        return this.chain;
    }
}