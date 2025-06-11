import React, { useState, useRef, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { Notice, TFile } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { importConversation } from "src/utils/chatHistory";
import { ChatFormProps } from "src/types/index";

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

    const [isRenaming, setIsRenaming] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            // Set initial value to current chat name without extension
            setNewChatName(chatFile?.basename || "");
        }
    }, [isRenaming, chatFile]);

    // Select a chat
    const handleChatSelect = async (filePath: string) => {
        try {
            const file = app.vault.getAbstractFileByPath(filePath) as TFile;
            if (!file) {
                console.error("Selected chat file no longer exists");
                const updatedChats = await loadChatFiles();
                if (updatedChats.length > 0) {
                    setChatFile(updatedChats[0]);
                    setConversation(await importConversation(updatedChats[0]));
                }
                return;
            }

            setChatFile(file);
            setConversation(await importConversation(file));
        } catch (err) {
            const errorMsg = 'Error selecting chat: ' + err;  
            new Notice(errorMsg, 5000);

            const updatedChats = await loadChatFiles();
            if (updatedChats.length > 0) {
                setChatFile(updatedChats[0]);
                setConversation(await importConversation(updatedChats[0]));
            }
        }
    };

    // Rename a chat
    const handleRenameChat = async () => {
        if (!chatFile || !newChatName.trim()) return;

        const newPath = `${settings.chatsFolder}/${newChatName}.md`;
        try {
            await app.fileManager.renameFile(chatFile, newPath);
            await loadChatFiles();
            setIsRenaming(false);
            setNewChatName("");

            const rename = app.vault.getAbstractFileByPath(newPath) as TFile;
            if (rename) setChatFile(rename);
        } catch (err) {
            const errorMsg = "Error renaming chat file: " + err;
            new Notice(errorMsg, 5000);
        }
    };
    // Cancel the rename of a chat
    const cancelRename = () => {
        setIsRenaming(false);
        setNewChatName("");
    };

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

            await app.vault.delete(chatFile);

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
            
            const updatedChats = await loadChatFiles();
            if (updatedChats.length > 0) {
                setChatFile(updatedChats[0]);
                setConversation(await importConversation(updatedChats[0]));
            }
        }
    };

    return (
        <div style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            alignItems: "center"
        }}>
            <select
                value={chatFile?.path || ""}
                onChange={(e) => handleChatSelect(e.target.value)}
                style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "var(--radius-s)",
                    backgroundColor: "var(--background-primary)",
                    border: "1px solid var(--background-modifier-border)",
                    color: "var(--text-normal)"
                }}
            >
                {chatFiles.map((file: TFile) => (
                    <option key={file.path} value={file.path}>
                        {file.basename}
                    </option>
                ))}
            </select>

            {isRenaming ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newChatName.trim()) {
                                handleRenameChat();
                            } else if (e.key === 'Escape') {
                                cancelRename();
                            }
                        }}
                        placeholder="New chat name"
                        style={{
                            padding: "0.5rem",
                            borderRadius: "var(--radius-s)",
                            backgroundColor: "var(--background-primary)",
                            border: "1px solid var(--background-modifier-border)",
                            color: "var(--text-normal)"
                        }}
                    />
                    <button
                        onClick={handleRenameChat}
                        style={{
                            padding: "0.5rem",
                            borderRadius: "var(--radius-s)",
                            backgroundColor: "var(--background-modifier-hover)",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer"
                        }}
                    >
                        Save
                    </button>
                    <button
                        onClick={cancelRename}
                        style={{
                            padding: "0.5rem",
                            borderRadius: "var(--radius-s)",
                            backgroundColor: "var(--background-modifier-hover)",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer"
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <>
                    <button
                        onClick={() => setIsRenaming(true)}
                        style={{
                            padding: "0.5rem",
                            borderRadius: "var(--radius-s)",
                            backgroundColor: "var(--background-modifier-hover)",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer"
                        }}
                    >
                        <Edit2 size={16} />
                    </button>

                    <button
                        onClick={handleDeleteChat}
                        disabled={chatFiles.length <= 1}
                        style={{
                            padding: "0.5rem",
                            borderRadius: "var(--radius-s)",
                            backgroundColor: "var(--background-modifier-hover)",
                            border: "none",
                            color: chatFiles.length <= 1 ? "var(--text-faint)" : "var(--text-muted)",
                            cursor: chatFiles.length <= 1 ? "not-allowed" : "pointer",
                            opacity: chatFiles.length <= 1 ? 0.5 : 1
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </>
            )}

            <button
                onClick={handleCreateChat}
                style={{
                    padding: "0.5rem",
                    borderRadius: "var(--radius-s)",
                    backgroundColor: "var(--interactive-accent)",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer"
                }}
            >
                <Plus size={16} style={{ stroke: "var(--text-normal)" }}/>
            </button>
        </div>
    );
};