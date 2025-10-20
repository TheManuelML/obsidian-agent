import { useAutoScroll } from "src/feature/chat/hooks/useAutoScroll";
import ChatMessage from "src/feature/chat/components/Message";
import { HistoryProps } from "src/types/chat";

export default function History({
  activeChat,
  conversation,
  setConversation,
}: HistoryProps) {
  const bottomRef = useAutoScroll(conversation);

  return (
    <div className="obsidian-agent__chat-messages">
      {conversation.map((message, index) => (
        <ChatMessage
          key={index}
          index={index}
          message={message}
          setConversation={setConversation}
          activeChat={activeChat}
        />
      ))}
  
      <div ref={bottomRef}></div>
    </div>
  );
};