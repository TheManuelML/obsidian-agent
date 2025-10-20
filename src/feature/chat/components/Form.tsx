import { Trash2, CirclePlus, History } from "lucide-react";
import { TFile } from "obsidian";
import { getApp } from "src/plugin";
import { handleCreateChat, handleDeleteChat } from "../handlers/chatHandlers";
import { DeleteChatModal } from "src/feature/modals/DeleteChatModal";
import { ChatHistoryModal } from "src/feature/modals/ChatHistoryModal";
import { FormProps } from "src/types/chat";

export default function Form({
  activeChat,
  setActiveChat,
  availableChats,
  setAvailableChats
}: FormProps) {

  // Open chat history modal
  const openChatHistory = async () => {
    const app = getApp();
    new ChatHistoryModal(
      app, 
      activeChat,
      async (c: TFile) => { setActiveChat(c) }
    ).open();
  }

  // Creates a new chat and changes states
  const handleCreateWithStates = async () => {
    const { activeChat, availableChats } = await handleCreateChat();
    setActiveChat(activeChat);
    setAvailableChats(availableChats);
    return;
  }

  // Deletes a chat and changes states
  const handleDeleteWithStates = async () => {
    const { activeChat: chat, availableChats: chatList } = await handleDeleteChat(activeChat!, availableChats);
    setActiveChat(chat);
    setAvailableChats(chatList);
    return;
  }

  return (
    <div className="obsidian-agent__chat-form">
      <button
        onClick={openChatHistory}
        className="obsidian-agent__chat-form__title"
      >
        {activeChat ? activeChat.basename : "No chat selected"}
      </button>
      
      <div className="obsidian-agent__chat-form__actions">
        <button 
          onClick={handleCreateWithStates}
          title="Create new chat"
          className="obsidian-agent__button-icon-primary"
        >
          <CirclePlus size={20} />
        </button>

        <button
          onClick={openChatHistory} 
          title="Select chat"
          className="obsidian-agent__button-icon"
        >
          <History size={20}/>
        </button>

        <button
          onClick={() => {
            if (activeChat) {
              const app = getApp();
              new DeleteChatModal(
                app,
                async () => { await handleDeleteWithStates() },
                activeChat.basename
              ).open();
            }
          }}
          title="Delete chat"
          disabled={availableChats.length <= 1}
          className="obsidian-agent__button-icon"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}