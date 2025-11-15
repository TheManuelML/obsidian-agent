import { MessageSquareOff } from "lucide-react";
import ChatMessage from "src/feature/chat/components/Message";
import { HistoryProps } from "src/types/chat";

export default function History({
  activeChat,
  conversation,
  setConversation,
}: HistoryProps) {
  // Show message history
  if (conversation.length > 0) return (
    <div className="obsidian-agent__chat-messages">
      {conversation.map((message, index) => (
        <ChatMessage
          key={index}
          index={index}
          message={message}
          conversation={conversation}
          setConversation={setConversation}
          activeChat={activeChat}
        />
      ))}
    </div>
  );

  // If no messages in the conversation show the starting message
  return (
    <div className="obsidian-agent__empty-chat">
      <MessageSquareOff size={40}/>
      <p>No messages have been sent. Send one to start the conversation.</p>
    </div>
  )
};