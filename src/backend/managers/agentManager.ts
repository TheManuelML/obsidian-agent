import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getPlugin, getSettings } from "src/plugin";
import { ModelManager } from "./modelManager";
import { MemoryManager } from "./memoryManager";
import { create_note, read_note, edit_note } from "../tools/obsidian_files";
import { create_dir, list_files } from "../tools/obsidian_dirs";
import { search } from "../tools/obsidian_search";
import { rename } from "../tools/obsidian_rename";

// Function that creates the agent and stores it in the plugin
export function initializeAgent() {
    const plugin = getPlugin();
    const settings = getSettings();
    
    // If the model stored in the plugin is different to the one in the settings recreate the model
    if (settings.model != plugin.modelName) {
        const llm = ModelManager.getInstance().getModel();
        plugin.modelName = settings.model; // Update the model
        
        // Recycle the memory saver, only create a new one if it doesn't exist
        if (!plugin.memorySaver) plugin.memorySaver = MemoryManager.getInstance().getMemorySaver();

        plugin.agent = createReactAgent({
            llm,
            tools: [
                create_note,
                read_note,
                edit_note,
                create_dir,
                list_files,
                search,
                rename,
            ],
            checkpointSaver: plugin.memorySaver,
        });
    }
}