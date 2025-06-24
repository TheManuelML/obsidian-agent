import React from "react";
import { Plus, Trash2, History } from "lucide-react";
import { Notice, TFile } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { importConversation } from "src/utils/chatHistory";
import { ChatFormProps } from "src/types/index";
import { ChatHistoryModal } from "src/components/modal/ChatHistoryModal";
import { DeleteChatModal } from "src/components/modal/DeleteChatModal";

export const ChatForm: React.FC<ChatFormProps> = ({
    chatFile,
    chatFiles,
    setChatFile,
    setConversation,
    loadChatFiles,
    handleCreateChat
}) => {
    const app = getApp();
    const settings = getSettings();

    // Delete a chat
    const handleDeleteChat = async () => {
        if (!chatFile || chatFiles.length <= 1) return;
        try {
            // Get current chat files before deletion
            const currentChats = await loadChatFiles();
            if (currentChats.length <= 1) return;

            // Verify the file still exists before trying to delete it
            const fileToDelete = app.vault.getAbstractFileByPath(chatFile.path);
            if (!fileToDelete) {
                console.error("Chat file no longer exists");
                const updatedChats = await loadChatFiles();
                if (updatedChats.length > 0) {
                    setChatFile(updatedChats[0]);
                    setConversation(await importConversation(updatedChats[0]));
                }
                return;
            }
            await app.fileManager.trashFile(chatFile);

            // Get updated chat files after deletion
            const updatedChats = await loadChatFiles();
            if (updatedChats.length > 0) {
                // Find the next available chat (not the one we just deleted)
                const nextChat = updatedChats.find((chat: TFile) => chat.path !== chatFile.path) || updatedChats[0];
                setChatFile(nextChat);
                setConversation(await importConversation(nextChat));
            }
        } catch (err) {
            const errorMsg = "Error deleting chat file: " + err;
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
            
            const updatedChats = await loadChatFiles();
            if (updatedChats.length > 0) {
                setChatFile(updatedChats[0]);
                setConversation(await importConversation(updatedChats[0]));
            }
        }
    };

    // Open chat history modal
    const openChatHistory = async () => {
        new ChatHistoryModal(app, chatFile, async (note: TFile) => {
            setChatFile(note);
            setConversation(await importConversation(note));
        }).open();
    }

    return (
        <div className="chat-form">
            <div>
                <button
                    onClick={openChatHistory}
                    className="chat-file-title"
                >
                    {chatFile?.basename || "No chat selected"}
                </button>
            </div>
            <div className="chat-form-actions">
                <button 
                    onClick={handleCreateChat} 
                    title="Create new chat"
                    className="button-icon-primary"
                >
                    <Plus size={28} />
                </button>

                <button 
                    onClick={openChatHistory} 
                    title="Select chat"
                    className="button-icon"
                >
                    <History size={20}/>
                </button>

                <button
                    onClick={() => {
                        if (!chatFile || chatFiles.length <= 1) return;
                        new DeleteChatModal(
                            app,
                            async () => { await handleDeleteChat(); },
                            chatFile?.basename
                        ).open();
                    }}
                    title="Delete chat"
                    disabled={chatFiles.length <= 1}
                    className="button-icon"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
};