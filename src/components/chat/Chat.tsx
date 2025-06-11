import React, { useEffect } from "react";
import { TFile } from "obsidian";
import { ChatInput } from "src/components/chat/Input";
import { ChatForm } from "src/components/chat/ChatForm";
import { ChatMessages } from "src/components/chat/ChatMessages";
import { useChatFile } from "src/components/chat/hooks/useChatFile";
import { useChatFileMonitor } from "src/components/chat/hooks/useChatFileMonitor";
import { useAutoScroll } from "src/components/chat/hooks/useAutoScroll";
import { ChatStreamingService } from "src/components/chat/services/chatStreamingService";

export const Chat: React.FC = () => {
  const streamingService = new ChatStreamingService();

  const {
    chatFile,
    setChatFile,
    chatFiles,
    conversation,
    setConversation,
    loadChatFiles,
    handleCreateChat,
    ensureActiveChat
  } = useChatFile();

  const bottomRef = useAutoScroll(conversation);
  
  // Monitor changes in the chat folder
  useChatFileMonitor(chatFile, setChatFile, setConversation, loadChatFiles);

  // Initialize chat on mount
  useEffect(() => {
    const initializeChat = async () => {
      await ensureActiveChat();
    };
    initializeChat();
  }, []);

  // Handle the calls to the agent
  const handleSendMessage = async (message: string, notes?: TFile[], images?: File[]) => {
    const activeChatFile = await ensureActiveChat();
    if (!activeChatFile) {
      console.error("No se pudo crear o encontrar archivo de chat");
      return;
    }

    // Call the streaming service to run the chain
    await streamingService.startStreaming(
      message,
      activeChatFile,
      setConversation,
      notes,
      images
    );
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
        bottomRef={bottomRef}
      />
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <ChatInput onSend={handleSendMessage}/>
      </div>  
    </div>
  );
};