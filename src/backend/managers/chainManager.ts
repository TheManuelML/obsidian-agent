import { MemoryManager } from "./memoryManager";
import { ModelManager } from "./modelManager";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { LanguageModelLike } from "@langchain/core/language_models/base";
import { Runnable } from "@langchain/core/runnables";
import { create_note, edit_note, read_note } from "../tools/obsidian_files";
import { create_dir, list_files } from "../tools/obsidian_dirs";
import { search } from "../tools/obsidian_search";
import { rename } from "../tools/obsidian_rename";

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
                create_note,
                read_note,
                edit_note,
                create_dir,
                list_files,
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