import React from "react";
import { ChatMessagesProps } from "src/types";
import { ChatSingleMessage } from "src/components/chat/ChatSingleMessage";
import { MessageSender } from "src/types";

export const ChatMessages: React.FC<ChatMessagesProps & { onRegenerate?: (index: number) => void }> = ({ 
    conversation, 
    bottomRef,
    onRegenerate 
}) => {
    const handleRegenerate = (index: number) => {
        if (onRegenerate) {
            onRegenerate(index);
        }
    };

    return (
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
                <ChatSingleMessage 
                    key={i} 
                    message={msg} 
                    onRegenerate={msg.sender === MessageSender.BOT ? () => handleRegenerate(i) : undefined}
                />
            ))}
            <div ref={bottomRef}></div>
        </div>
    );
};