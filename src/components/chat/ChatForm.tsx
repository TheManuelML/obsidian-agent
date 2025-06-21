import React, { useState, useRef, useEffect } from "react";
import { Plus, Edit2, Trash2, X, ChevronDown } from "lucide-react";
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
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            // Set initial value to current chat name without extension
            setNewChatName(chatFile?.basename || "");
        }
    }, [isRenaming, chatFile]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsSelectOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Select a chat
    const handleChatSelect = async (filePath: string) => {
        try {
            const file = app.vault.getAbstractFileByPath(filePath);
            if (!(file instanceof TFile)) {
                console.error("Selected chat file no longer exists or is not a TFile");
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
            if (settings.debug) console.error(errorMsg);

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

            const rename = app.vault.getAbstractFileByPath(newPath);
            if (rename instanceof TFile) setChatFile(rename);
        } catch (err) {
            const errorMsg = "Error renaming chat file: " + err;
            new Notice(errorMsg, 5000);
            if (settings.debug) console.error(errorMsg);
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
            if (settings.debug) console.error(errorMsg);
            
            const updatedChats = await loadChatFiles();
            if (updatedChats.length > 0) {
                setChatFile(updatedChats[0]);
                setConversation(await importConversation(updatedChats[0]));
            }
        }
    };

    return (
        <div className="chat-form">
            <div ref={selectRef} className="chat-select-container">
                <div
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className="chat-select-button"
                >
                    <span>{chatFile?.basename}</span>
                    <ChevronDown 
                        size={14} 
                        style={{
                            transform: isSelectOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease"
                        }} 
                    />
                </div>
                {isSelectOpen && (
                    <div className="chat-select-dropdown">
                        {chatFiles.map((file: TFile) => (
                            <div
                                key={file.path}
                                onClick={() => {
                                    handleChatSelect(file.path);
                                    setIsSelectOpen(false);
                                }}
                                className={`chat-select-option ${file.path === chatFile?.path ? 'current' : ''}`}
                            >
                                {file.basename}{file.path === chatFile?.path ? " (current)" : ""}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isRenaming ? (
                <div className="chat-rename-container">
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
                        className="chat-rename-input"
                    />
                    <button onClick={handleRenameChat} className="chat-button">
                        Save
                    </button>
                    <button onClick={cancelRename} className="chat-button">
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <>
                    <button onClick={() => setIsRenaming(true)} className="chat-button">
                        <Edit2 size={16} />
                    </button>

                    <button
                        onClick={handleDeleteChat}
                        disabled={chatFiles.length <= 1}
                        className="chat-button"
                    >
                        <Trash2 size={16} />
                    </button>
                </>
            )}

            <button onClick={handleCreateChat} className="chat-button chat-button-primary">
                <Plus size={16} className="chat-icon"/>
            </button>
        </div>
    );
};