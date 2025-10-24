import { useState, useEffect } from "react";
import { TFile } from "obsidian";
import Form from "src/feature/chat/components/Form";
import History from "src/feature/chat/components/History";
import Input from "src/feature/chat/components/Input";
import { ensureActiveChat } from "src/feature/chat/handlers/chatHandlers";
import { importConversation } from "src/utils/chat/chatHistory";
import { Message } from "src/types/chat";

export default function Chat() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<TFile | null>(null);
  const [availableChats, setAvailableChats] = useState<TFile[]>([]);

  // Executed when loading the component
  useEffect(() => {
    const fetchData = async () => {
      const { activeChat: chat, availableChats } = await ensureActiveChat();
      setActiveChat(chat);
      setAvailableChats(availableChats);
    };
  
    fetchData();
  }, []);

  // Executed when the active chat file changes
  useEffect(() => {
    if (!activeChat) return;
  
    const loadConversation = async () => {
      const messages = await importConversation(activeChat);
      setConversation(messages);
    };
  
    loadConversation();
  }, [activeChat]);
  

  return (
    <div className="obsidian-agent__chat-main__container">
      <Form
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        availableChats={availableChats}
        setAvailableChats={setAvailableChats}
      />

      <hr className="obsidian-agent__hr"/>

      <History
        activeChat={activeChat}
        conversation={conversation}
        setConversation={setConversation}
      />

      <hr className="obsidian-agent__hr"/>
      
      <Input
        initialValue={""}
        activeChat={activeChat}
        editingMessageIndex={null}
        isRegeneration={false}
        setIsEditing={null}
        setConversation={setConversation}
        attachments={[]}
      />
    </div>
  );
};