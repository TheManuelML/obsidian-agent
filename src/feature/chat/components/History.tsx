import ChatMessage from "src/feature/chat/components/Message";
import { HistoryProps } from "src/types/chat";

export default function History({
  activeChat,
  conversation,
  setConversation,
}: HistoryProps) {
  return (
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
};