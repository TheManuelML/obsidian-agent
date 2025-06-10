// TODO: Modularize the chat handlers

import { useState, useRef, useEffect } from "react";
import { TFile, TFolder } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { ChatInput } from "./Input";
import { ChatForm } from "./ChatForm";
import { ChatMessages } from "./ChatMessages";
import { formatTagsForChat } from "src/utils/formating";
import { getTime, getTimeId } from "src/utils/time";
import { exportMessage, importConversation, getThreadId, getLastNMessages } from "src/utils/chatHistory";
import { Message, MessageSender } from "src/types/index";
import { ChainManager } from "src/backend/managers/chainManager";
import { ChainRunner } from "src/backend/managers/chainRunner";

export const Chat: React.FC = () => {
  const app = getApp();
  const settings = getSettings();
  
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatFile, setChatFile] = useState<TFile | null>(null);
  const [chatFiles, setChatFiles] = useState<TFile[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasSentFirst = useRef(false);

  // Create a new chat file
  const handleCreateChat = async () => {
    let chatFolder: TFolder | null = app.vault.getFolderByPath(settings.chatsFolder);
    if (!chatFolder) {
      try {
        chatFolder = await app.vault.createFolder(settings.chatsFolder);
      } catch (err) {
        console.error("Error creating chat folder:", err);
        return;
      }
    }

    const timestamp = getTimeId();
    const chatFileName = `chat-${timestamp}.md`;
    const chatFilePath = `${chatFolder.path}/${chatFileName}`;
    
    const tags = formatTagsForChat(
      getTime(), 
      chatFileName.replace('.md', '')
    );

    try {
      const newFile = await app.vault.create(chatFilePath, tags);
      setChatFile(newFile);
      
      await loadChatFiles();
      
      setConversation([]); // Empty conversation for a new chat
    } catch (err) {
      console.error("Error creating chat file:", err);
    }
  };

  // Load available chat files
  const loadChatFiles = async (): Promise<TFile[]> => {
    const chatFolder = app.vault.getFolderByPath(settings.chatsFolder);
    if (!chatFolder) return [];

    const files = app.vault.getFiles().filter(file => 
      file.path.startsWith(chatFolder.path) && file.extension === 'md'
    );
    setChatFiles(files);
    return files;
  };

  // Ensure that there is always an active chat file
  const ensureActiveChat = async (): Promise<TFile | null> => {
    if (chatFile) return chatFile;
    
    let chatFolder: TFolder | null = app.vault.getFolderByPath(settings.chatsFolder);
    if (!chatFolder) {
      try {
        chatFolder = await app.vault.createFolder(settings.chatsFolder);
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
      setConversation(await importConversation(mostRecentChat));
      return mostRecentChat;
    }

    // If no chat files exist, create a new one
    const timestamp = getTimeId();
    const chatFileName = `chat-${timestamp}.md`;
    const chatFilePath = `${chatFolder.path}/${chatFileName}`;

    const tags = formatTagsForChat(
      getTime(), 
      chatFileName.replace('.md', '')
    );
    
    let newFile: TFile;
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
          setConversation(await importConversation(updatedChats[0]));
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

  // Manage the scroll in the component
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);


  const startStreaming = async (message: string, notes?: TFile[], images?: File[]) => {
    const chain = ChainManager.getInstance().getChain();
    const runner = new ChainRunner();
  
    try {
      // Ensure we have a chat file before proceeding
      const activeChatFile = await ensureActiveChat();
      if (!activeChatFile) throw new Error("No se pudo crear o encontrar archivo de chat");
  
      // Verify the chat file still exists
      const fileExists = app.vault.getAbstractFileByPath(activeChatFile.path);
      if (!fileExists) {
        console.error("Chat file was deleted, creating a new one...");
        const newChat = await ensureActiveChat();
        if (!newChat) throw new Error("No se pudo recrear archivo de chat");
      }
  
      // Add user message to the conversation
      const userMessage = {
        sender: MessageSender.USER,
        content: message,
        timestamp: getTime(),
      };
      
      setConversation((prev) => [...prev, userMessage]);
      setIsLoading(true);
  
      // Export the user message to the chat file
      await exportMessage(userMessage, activeChatFile);
  
      // Create a placeholder message for the AI
      const tempBotMessage = {
        sender: MessageSender.BOT,
        content: "",
        timestamp: getTime(),
      };
      setConversation((prev) => [...prev, tempBotMessage]);
  
      // Get last messages if it's the first time sending after restart
      let lastMessages: Message[] = [];
      if (!hasSentFirst.current) {
        lastMessages = await getLastNMessages(activeChatFile, settings.amountOfMessagesInMemory * 2);
        hasSentFirst.current = true;
      }
  
      let accumulated = "";
      let hasReceivedFirstChunk = false;
  
      const updateAiMessage = (chunk: string) => {
        if (!hasReceivedFirstChunk) {
          setIsLoading(false); // Remove loading animation on first chunk
          hasReceivedFirstChunk = true;
        }
        
        accumulated += chunk;
        
        // Update the last message in conversation directly
        setConversation((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: accumulated
          };
          return updated;
        });
      };
  
      // Get the thread_id from the files tags
      const threadId = await getThreadId(activeChatFile);
      // Run the streaming
      await runner.run(chain, threadId, userMessage, notes, images, updateAiMessage);
  
      // Export the final bot message
      const currentChatFile = app.vault.getAbstractFileByPath(activeChatFile.path);
      if (currentChatFile) {
        const finalBotMessage = {
          sender: MessageSender.BOT,
          content: accumulated,
          timestamp: getTime(),
        };
        await exportMessage(finalBotMessage, currentChatFile as TFile);
      } else {
        console.error("Chat file was deleted while waiting for response");
      }
  
    } catch (err) {
      console.error("Error during streaming:", err);
      
      // Update with error message
      const errorMessage = `❌ ERROR: ${err instanceof Error ? err.message : "Error processing message."}`;
      
      setConversation((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: errorMessage,
            isErrorMessage: true,
          };
        }
        return updated;
      });
  
      // Try to export error message too
      try {
        const activeChatFile = await ensureActiveChat();
        if (activeChatFile) {
          const errorBotMessage = {
            sender: MessageSender.BOT,
            content: errorMessage,
            timestamp: getTime(),
            isErrorMessage: true,
          };
          await exportMessage(errorBotMessage, activeChatFile);
        }
      } catch (exportErr) {
        console.error("Error saving error message:", exportErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "1rem",
      position: "relative",
    }}>
      <ChatForm 
        chatFile={chatFile}
        chatFiles={chatFiles}
        setChatFile={setChatFile}
        setConversation={setConversation}
        loadChatFiles={loadChatFiles}
        handleCreateChat={handleCreateChat}
      />
      <ChatMessages 
        conversation={conversation}
        isLoading={isLoading}
        bottomRef={bottomRef}
      />
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <ChatInput onSend={startStreaming}/>
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