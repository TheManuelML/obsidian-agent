import React, { useState, useRef, useEffect, cloneElement } from "react";
import { Clipboard, Bot, User, Plus, Edit2, Trash2, X } from "lucide-react";
import { marked } from 'marked';
import { TFile, TFolder } from "obsidian";
import { getApp, getPlugin } from "../plugin";
import { Input } from "./Input";
import { callAgent } from "../backend/agent";
import { formatTagsForChat } from "../utils/formating";
import { parseCodeSnippets } from "../utils/parsing";
import { processAttachedFiles } from "../utils/handleAttachments";
import { exportMessage, importConversation, getThreadId, getLastNMessages } from "../utils/chatHistory";

export const Chat: any = () => {
  const app = getApp();
  const plugin = getPlugin();
  let language = plugin.settings.language || 'en';

  const [conversation, setConversation] = useState<Message[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatFile, setChatFile] = useState<TFile | null>(null);
  const [chatFiles, setChatFiles] = useState<TFile[]>([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasSentFirst = useRef(false);

  // Load available chat files
  const loadChatFiles = async (): Promise<TFile[]> => {
    const chatFolder = app.vault.getFolderByPath(plugin.settings.chatsFolder);
    if (!chatFolder) return [];

    const files = app.vault.getFiles().filter(file => 
      file.path.startsWith(chatFolder.path) && file.extension === 'md'
    );
    setChatFiles(files);
    return files;
  };

  const ensureActiveChat = async (): Promise<TFile | null> => {
    if (chatFile) return chatFile;
    
    let chatFolder: TFolder | null = app.vault.getFolderByPath(plugin.settings.chatsFolder);
      if (!chatFolder) {
        try {
          chatFolder = await app.vault.createFolder(plugin.settings.chatsFolder);
        } catch (err) {
          console.error("Error creating chat folder:", err);
          return null;
        }
      }

      await loadChatFiles();

      const existing = chatFiles.length > 0 ? chatFiles : await loadChatFiles();
    if (existing.length > 0) {
      // If there are existing chat files, use the most recent one
      const mostRecentChat = existing.sort((a, b) => b.stat.mtime - a.stat.mtime)[0];
      setChatFile(mostRecentChat);
      
      // Import conversation
      setConversation(await importConversation(app, mostRecentChat));
      return mostRecentChat;
    }

    // If no chat files exist, create a new one
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const chatFileName = `chat-${timestamp}.md`;
    const chatFilePath = `${chatFolder.path}/${chatFileName}`;

    let newFile: TFile;
    const tags = formatTagsForChat(
      new Date(Date.now()).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).toString(), 
      chatFileName.replace('.md', '')
    );
    try {
      newFile = await app.vault.create(chatFilePath, tags);
      setChatFile(newFile);
      
      await loadChatFiles();

      setConversation([]);
      return newFile;
    } catch (err) {
      console.error("Error creating chat file:", err);
      return null;
    }  
  };

  // Initialize chat file
  useEffect(() => {
    const initializeChat = async () => {
      // Ensure active chat is set up
      await ensureActiveChat();
    };
    initializeChat();
  }, []);

  // Monitor if current chat file still exists
  useEffect(() => {
    const checkChatFile = async () => {
      if (!chatFile) return;

      const fileExists = app.vault.getAbstractFileByPath(chatFile.path);
      if (!fileExists) {
        console.log("Current chat file no longer exists, updating state...");
        const updatedChats = await loadChatFiles();
        if (updatedChats.length > 0) {
          setChatFile(updatedChats[0]);
          setConversation(await importConversation(app, updatedChats[0]));
        } else {
          setChatFile(null);
          setConversation([]);
        }
      }
    };

    // Check immediately and then every 2 seconds
    checkChatFile();
    const interval = setInterval(checkChatFile, 2000);

    return () => clearInterval(interval);
  }, [chatFile]);

  const handleChatSelect = async (filePath: string) => {
    try {
      const file = app.vault.getAbstractFileByPath(filePath) as TFile;
      if (!file) {
        console.error("Selected chat file no longer exists");
        const updatedChats = await loadChatFiles();
        if (updatedChats.length > 0) {
          setChatFile(updatedChats[0]);
          setConversation(await importConversation(app, updatedChats[0]));
        }
        return;
      }

      setChatFile(file);
      setConversation(await importConversation(app, file));
    } catch (err) {
      console.error("Error selecting chat:", err);
      const updatedChats = await loadChatFiles();
      if (updatedChats.length > 0) {
        setChatFile(updatedChats[0]);
        setConversation(await importConversation(app, updatedChats[0]));
      }
    }
  };

  const handleCreateChat = async () => {
    let chatFolder: TFolder | null = app.vault.getFolderByPath(plugin.settings.chatsFolder);
    if (!chatFolder) {
      try {
        chatFolder = await app.vault.createFolder(plugin.settings.chatsFolder);
      } catch (err) {
        console.error("Error creating chat folder:", err);
        return;
      }
    }

    // Create a new chat file with a timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const chatFileName = `chat-${timestamp}.md`;
    const chatFilePath = `${chatFolder.path}/${chatFileName}`;

    const tags = formatTagsForChat(
      new Date(Date.now()).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).toString(), 
      chatFileName.replace('.md', '')
    );
    try {
      const file = await app.vault.create(chatFilePath, tags);
      setChatFile(file);

      await loadChatFiles();
      setConversation([]);
    } catch (err) {
      console.error("Error creating chat file:", err);
    }
  };

  const handleRenameChat = async () => {
    if (!chatFile || !newChatName.trim()) return;

    const newPath = `${plugin.settings.chatsFolder}/${newChatName}.md`;
    try {
      await app.fileManager.renameFile(chatFile, newPath);
      await loadChatFiles();
      setIsRenaming(false);
      setNewChatName("");

      const rename = app.vault.getAbstractFileByPath(newPath) as TFile;
      if (rename) setChatFile(rename);
    } catch (err) {
      console.error("Error renaming chat file:", err);
    }
  };

  const handleSend = async (message: string, notes?: TFile[] | null, files?: File[] | null) => {
    // Ensure we have a chat file before proceeding
    const activeChatFile = await ensureActiveChat();
    if (!activeChatFile) return;

    // Verify the chat file still exists
    const fileExists = app.vault.getAbstractFileByPath(activeChatFile.path);
    if (!fileExists) {
      console.error("Chat file was deleted, creating a new one...");
      const newChat = await ensureActiveChat();
      if (!newChat) {
        console.error("Failed to create new chat file.");
        return;
      }
    }

    // Get current time for the message timestamp
    const time = new Date(Date.now()).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).toString();
    
    // Add user message immediately
    const userMessage = { sender: <User size={20}/>, text: message, type: 'user' as const, timestamp: time };
    setConversation((prev) => [...prev, userMessage]);
    
    // Save the message in the chat file
    try {
      await exportMessage(app, userMessage, activeChatFile);
    } catch (err) {
      console.error("Error saving user message:", err);
      return;
    }

    setIsLoading(true);

    let fullMessage = message;
    let imagesToSend: string[] = [];
    
    // Read attached files
    if (files && files.length > 0) {
      const fileDataList = await processAttachedFiles(files);
      
      // Only process images
      for (const fileData of fileDataList) {
        if (fileData.type.startsWith("image/")) {
          imagesToSend.push(fileData.content);
        }
      }
    }

    const threadId = await getThreadId(app, activeChatFile);
    
    // Just append the last messags of the chat if it is the first time sending a message after a restart
    let lastMessages: Message[] = [];
    if (!hasSentFirst.current) {
      lastMessages = await getLastNMessages(app, activeChatFile, plugin.settings.amountOfMessagesInMemory * 2);
      hasSentFirst.current = true;
    }
    try {
      const response = await callAgent(plugin, fullMessage, threadId, imagesToSend, lastMessages);
      const botMessage = { sender: <Bot size={20}/>, text: response, type: 'bot' as const, timestamp: time };
      setConversation((prev) => [...prev, botMessage]);

      // Verify chat file still exists before saving bot message
      const currentChatFile = app.vault.getAbstractFileByPath(activeChatFile.path);
      if (currentChatFile) {
        await exportMessage(app, botMessage, currentChatFile as TFile);
      } else {
        console.error("Chat file was deleted while waiting for response");
      }
    
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error processing message.";
      const errorBotMessage = { sender: <Bot size={20}/>, text: `❌ ERROR: ${errorMessage}`, type: 'bot' as const, timestamp: time };
      setConversation((prev) => [...prev, errorBotMessage]);

      // Verify chat file still exists before saving error message
      const currentChatFile = app.vault.getAbstractFileByPath(activeChatFile.path);
      if (currentChatFile) {
        await exportMessage(app, errorBotMessage, currentChatFile as TFile);
      } else {
        console.error("Chat file was deleted while processing error");
      }
    
    } finally {
      setIsLoading(false);
      setSelectedImages([]); // Clear selected images after sending
    }
  };

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
          setConversation(await importConversation(app, updatedChats[0]));
        }
        return;
      }

      await app.vault.delete(chatFile);
      
      // Get updated chat files after deletion
      const updatedChats = await loadChatFiles();
      if (updatedChats.length > 0) {
        // Find the next available chat (not the one we just deleted)
        const nextChat = updatedChats.find(chat => chat.path !== chatFile.path) || updatedChats[0];
        setChatFile(nextChat);
        setConversation(await importConversation(app, nextChat));
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
      const updatedChats = await loadChatFiles();
      if (updatedChats.length > 0) {
        setChatFile(updatedChats[0]);
        setConversation(await importConversation(app, updatedChats[0]));
      }
    }
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setNewChatName("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "1rem",
      position: "relative",
    }}>
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
          {chatFiles.map(file => (
            <option key={file.path} value={file.path}>
              {file.basename}
            </option>
          ))}
        </select>

        {isRenaming ? (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
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

      <div style={{
        flex: 1,
        overflowY: "auto",
        border: "none",
        borderRadius: "var(--radius-s)",
        padding: "0",
        backgroundColor: "var(--background-secondary)",
        marginBottom: "1rem",
      }}>
        {conversation.map((msg, i) => (
          <div key={i} style={{
            backgroundColor: "transparent",
            padding: "0",
            margin: "0.5rem 0",
            maxWidth: "100%",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            position: "relative", 
            userSelect: "text",
            borderBottom: "1px solid var(--background-secondary-alt)",
          }}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ 
                opacity: msg.type === 'user' 
                  ? "0.8" 
                  : "1.0",
                color: msg.type === 'user'
                  ? "var(--interactive-accent)"
                  : "var(--interactive-accent-hover)",
                }}>
                {cloneElement(msg.sender as React.ReactElement<any>, { size: "28" })}
              </div>
              <span style={{ 
                opacity: '0.8', 
                color: msg.type === 'user' ? 'var(--interactive-accent)' : 'var(--interactive-accent-hover)', 
                fontSize: "var(--font-ui-smaller)",
                fontWeight: "semibold",
              }}>
                {msg.timestamp.toString()}
              </span>
            </div>
            {parseCodeSnippets(msg.text).map((frag, j) => (
              frag.isCode ? (
                <div key={j} style={{ position: "relative", marginTop: "0.5rem" }}>
                  <button 
                    onClick={() => copyToClipboard(frag.text)}
                    style={{
                      position: "absolute",
                      top: "0.25rem",
                      right: "0.25rem",
                      fontSize: "0.75rem",
                      padding: "0.1rem 0.3rem",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      backgroundColor: "transparent",
                      border: "none",
                      boxShadow: "none",
                    }}
                  >
                    <Clipboard size={16} />
                  </button>
                  <pre 
                    style={{
                      fontSize: "var(--font-ui-small)",
                      backgroundColor: "var(--background-modifier-border)",
                      padding: "0.5rem",
                      borderRadius: "var(--radius-s)",
                      overflowX: "auto",
                      margin: 0,
                    }}
                  >
                    {frag.text}
                  </pre>
                </div>
              ) : (
                <div 
                  key={j} 
                  style={{
                    fontSize: "var(--font-ui-small)",
                    lineHeight: "1.5",
                    marginTop: "0.25rem",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    opacity: "0.9",
                    color: msg.type === 'user' 
                      ? "var(--text-muted)" 
                      : "var(--text-normal)"
                  }}
                  dangerouslySetInnerHTML={{ __html: marked(frag.text, { breaks: true })}}
                />
              )
            ))}
          </div>
        ))}
        {isLoading && (
          <div style={{
            alignSelf: "flex-start",
            backgroundColor: "transparent",
            color: "var(--text-normal)",
            borderRadius: "var(--radius-s)",
            position: "relative",
          }}>
            <Bot size={28} style={{ stroke: "var(--interactive-accent-hover)" }}/>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem"
            }}>
              <div className="typing-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>    
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <Input onSend={handleSend}/>
      </div>  
    </div>
  );
};

const styles = `
.typing-animation {
  display: flex;
  gap: 0.3rem;
  padding: 0.5rem;
}

.typing-animation span {
  width: 8px;
  height: 8px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: typing 1s infinite ease-in-out;
}

.typing-animation span:nth-child(1) {
  animation-delay: 0.2s;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.3s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);