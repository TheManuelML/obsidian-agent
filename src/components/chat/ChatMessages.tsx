import React from "react";
import { ChatMessagesProps } from "src/types";
import { ChatSingleMessage } from "src/components/chat/ChatSingleMessage";

export const ChatMessages: React.FC<ChatMessagesProps> = ({ conversation, bottomRef }) => {
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
                <ChatSingleMessage key={i} message={msg} />
            ))}
            <div ref={bottomRef}></div>
        </div>
    );
};