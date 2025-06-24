import React from "react";
import { ChatMessagesProps } from "src/types";
import { ChatSingleMessage } from "src/components/chat/ChatSingleMessage";
import { MessageSender } from "src/types";

export const ChatMessages: React.FC<ChatMessagesProps & { onRegenerate?: (index: number) => void, onEditUserMessage?: (index: number, newContent: string, attachments: any[]) => void }> = ({ 
    conversation, 
    bottomRef,
    onRegenerate,
    onEditUserMessage
}) => {
    const handleRegenerate = (index: number) => {
        if (onRegenerate) {
            onRegenerate(index);
        }
    };
    const handleEdit = (index: number, newContent: string, attachments: any[]) => {
        if (onEditUserMessage) {
            onEditUserMessage(index, newContent, attachments);
        }
    };
    return (
        <div className="chat-messages">
            {conversation.map((msg, i) => (
                <ChatSingleMessage 
                    key={i} 
                    message={msg} 
                    onRegenerate={msg.sender === MessageSender.BOT ? () => handleRegenerate(i) : undefined}
                    onEdit={msg.sender === MessageSender.USER ? (newContent, attachments) => handleEdit(i, newContent, attachments) : undefined}
                />
            ))}
            <div ref={bottomRef}></div>
        </div>
    );
};