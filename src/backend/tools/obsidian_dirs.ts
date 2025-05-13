import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getApp, getPlugin } from "../../plugin";


function sanitizePath(path: string): string {
    return path.replace(/(\.\.\/|\/{2,})/g, '/').replace(/\/+$/, '') + '/';
}

// Obsidian tool to create directories
export const create_dir = tool(async (input) => {
    // Declaring the app and inputs
    const app = getApp();
    const plugin = getPlugin();
    let { name, dir_path = '/' } = input; 

    // Sanitize the path
    dir_path = sanitizePath(dir_path);
    
    // Declaring the directory
    let dir: { [key: string] : any } = {
        name,
        dir_path,
    };

    // Create the directory
    try {
        // Check if the directory already exists
        if (app.vault.getAbstractFileByPath(dir.dir_path + dir.name)) {
            return {
                success: false,
                error: 'Directory already exists'
            };
        }
        await app.vault.createFolder(dir.dir_path + dir.name);    
    } catch (err) {
        console.error('Error creating directory in Obsidian:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }

    return {
        success: true,
        directory: dir.dir_path + dir.name
    };
}, {
    // Tool schema and metadata
    name: 'create_directory',
    description: 'Create a directory in Obsidian. No parameters are needed.',
    schema: z.object({
        name: z.string().optional().describe('The name of the directory'),
        dir_path: z.string().optional().describe('The path of the directory where is going to be placed'),
    })
})
