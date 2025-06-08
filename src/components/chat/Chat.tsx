import { useState, useRef, useEffect } from "react";
import { Bot, User } from "lucide-react";
import { TFile, TFolder } from "obsidian";
import { getApp, getPlugin } from "../../plugin";
import { ChatInput } from "./Input";
import { callAgent } from "../../backend/agent";
import { ChatForm } from "./ChatForm";
import { ChatMessages } from "./ChatMessages";
import { formatTagsForChat } from "../../utils/formating";
import { processAttachedImages } from "../../utils/processImages";
import { exportMessage, importConversation, getThreadId, getLastNMessages } from "../../utils/chatHistory";
import { Message } from "../../types/index";

export const Chat: React.FC = () => {
  const app = getApp();
  const plugin = getPlugin();
  
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatFile, setChatFile] = useState<TFile | null>(null);
  const [chatFiles, setChatFiles] = useState<TFile[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasSentFirst = useRef(false);

  // Create a new chat file
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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const chatFileName = `chat-${timestamp}.md`;
    const chatFilePath = `${chatFolder.path}/${chatFileName}`;

    const tags = formatTagsForChat(
      new Date(Date.now()).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).toString(), 
      chatFileName.replace('.md', '')
    );

    try {
      const newFile = await app.vault.create(chatFilePath, tags);
      setChatFile(newFile);
      await loadChatFiles();
      setConversation([]);
    } catch (err) {
      console.error("Error creating chat file:", err);
    }
  };

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

  // Ensure that there is always an active chat file
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
      setConversation(await importConversation(mostRecentChat));
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

  const handleSend = async (message: string, notes?: TFile[] | null, images?: File[] | null) => {
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
    const userMessage = { sender: 'user' as const, content: message, timestamp: time };
    setConversation((prev) => [...prev, userMessage]);
    
    // Save the message in the chat file
    try {
      await exportMessage(userMessage, activeChatFile);
    } catch (err) {
      console.error("Error saving user message:", err);
      return;
    }

    setIsLoading(true);

    let fullMessage = message;
    let imagesToSend: string[] = [];
    
    // Read attached images
    if (images && images.length > 0) {
      const imageDataList = await processAttachedImages(images);
      
      // Only process images
      for (const imageData of imageDataList) {
        if (imageData.type.startsWith("image/")) {
          imagesToSend.push(imageData.content);
        }
      }
    }

    // Add the path of the attached files
    if (notes && notes.length > 0) {
      fullMessage += "\nTake into account the following files:"

      let noteSection = "";      
      for (const note of notes) {
        noteSection += `\n- ${note.path}`     
      } 
      
      fullMessage += noteSection;
    }
    
    // Get the thread_id from the files tags
    const threadId = await getThreadId(activeChatFile);
    
    // Just append the last messags of the chat if it is the first time sending a message after a restart
    let lastMessages: Message[] = [];
    if (!hasSentFirst.current) {
      lastMessages = await getLastNMessages(activeChatFile, plugin.settings.amountOfMessagesInMemory * 2);
      hasSentFirst.current = true;
    }
    try {
      const response = await callAgent(plugin, fullMessage, threadId, imagesToSend, lastMessages);
      const botMessage = { sender: 'bot' as const, content: response, timestamp: time };
      setConversation((prev) => [...prev, botMessage]);

      // Verify chat file still exists before saving bot message
      const currentChatFile = app.vault.getAbstractFileByPath(activeChatFile.path);
      if (currentChatFile) {
        await exportMessage(botMessage, currentChatFile as TFile);
      } else {
        console.error("Chat file was deleted while waiting for response");
      }
    
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error processing message.";
      const errorBotMessage = { sender: 'bot' as const, content: `❌ ERROR: ${errorMessage}`, timestamp: time };
      setConversation((prev) => [...prev, errorBotMessage]);

      // Verify chat file still exists before saving error message
      const currentChatFile = app.vault.getAbstractFileByPath(activeChatFile.path);
      if (currentChatFile) {
        await exportMessage(errorBotMessage, currentChatFile as TFile);
      } else {
        console.error("Chat file was deleted while processing error");
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
        <ChatInput onSend={handleSend}/>
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