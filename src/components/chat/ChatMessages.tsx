import React from "react";
import { Bot } from "lucide-react";
import { ChatMessagesProps } from "src/types";
import { ChatSingleMessage } from "./ChatSingleMessage";

export const ChatMessages: React.FC<ChatMessagesProps> = ({ conversation, isLoading, bottomRef }) => {
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
            {isLoading && (
                <div style={{
                    alignSelf: "flex-start",
                    backgroundColor: "transparent",
                    color: "var(--text-normal)",
                    borderRadius: "var(--radius-s)",
                    position: "relative",
                }}>
                    <Bot size={28} style={{ stroke: "var(--interactive-accent-hover)" }}/>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "0.5rem"
                    }}>
                        <div className="typing-animation">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={bottomRef}></div>
        </div>
    );
};