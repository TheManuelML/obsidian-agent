import React, { useEffect, useState } from "react";
import { TFile } from "obsidian";
import { ChatInput } from "src/components/chat/Input";
import { ChatForm } from "src/components/chat/ChatForm";
import { ChatMessages } from "src/components/chat/ChatMessages";
import { useChatFile } from "src/components/chat/hooks/useChatFile";
import { useChatFileMonitor } from "src/components/chat/hooks/useChatFileMonitor";
import { useAutoScroll } from "src/components/chat/hooks/useAutoScroll";
import { ChatStreamingService } from "src/components/chat/services/chatStreamingService";
import { MessageSender } from "src/types";
import { rewriteChatHistory } from "src/utils/chatHistory";

export const Chat: React.FC = () => {
  const streamingService = new ChatStreamingService();
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);

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
  const handleSendMessage = async (message: string, notes: TFile[] = [], images: File[] = []) => {
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

  const handleRegenerate = async (index: number) => {
    // Find the last user message before the bot message
    const lastUserMessage = conversation
      .slice(0, index)
      .reverse()
      .find(msg => msg.sender === MessageSender.USER);

    if (lastUserMessage) {
      // Remove all messages after and including the bot message
      const newConversation = conversation.slice(0, index);
      setConversation(newConversation);

      // Call the streaming service directly with the last user message and its attachments
      const activeChatFile = await ensureActiveChat();
      if (!activeChatFile) {
        console.error("No se pudo crear o encontrar archivo de chat");
        return;
      }

      await streamingService.startStreaming(
        lastUserMessage.content,
        activeChatFile,
        setConversation,
        lastUserMessage.attachments,
        [],
        true // This is a regeneration
      );
    }
  };

  const handleEdit = async (index: number, newContent: string, attachments: TFile[]) => {
    // Remove all messages after and including the edited message
    const newConversation = conversation.slice(0, index);
    setConversation(newConversation);

    // Get the active chat file
    const activeChatFile = await ensureActiveChat();
    if (!activeChatFile) {
      console.error("No se pudo crear o encontrar archivo de chat");
      return;
    }

    // Rewrite the chat history up to the edited message
    await rewriteChatHistory(activeChatFile, newConversation);

    // Call the streaming service with the edited message
    await streamingService.startStreaming(
      newContent,
      activeChatFile,
      setConversation,
      attachments,
      [],
      false // This is not a regeneration, it's a new message
    );
  };

  return (
    <div className="chat-main-container">
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
        onRegenerate={handleRegenerate}
        onEdit={handleEdit}
        editingMessageIndex={editingMessageIndex}
        setEditingMessageIndex={setEditingMessageIndex}
      />
      <div className="chat-main-input-container">
        <ChatInput onSend={handleSendMessage}/>
      </div>  
    </div>
  );
};