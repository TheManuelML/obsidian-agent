import React from "react";
import { TFile } from "obsidian";
import { ChatMessagesProps } from "src/types";
import { ChatSingleMessage } from "src/components/chat/ChatSingleMessage";
import { MessageSender } from "src/types";

export const ChatMessages: React.FC<ChatMessagesProps & { 
    onRegenerate?: (index: number) => void;
    onEdit?: (index: number, newContent: string, attachments: TFile[]) => void;
}> = ({ 
    conversation, 
    bottomRef,
    onRegenerate,
    onEdit,
    editingMessageIndex,
    setEditingMessageIndex
}) => {
    const handleRegenerate = (index: number) => {
        if (onRegenerate) {
            onRegenerate(index);
        }
    };

    const handleEdit = (index: number, newContent: string, attachments: TFile[]) => {
        if (onEdit) {
            onEdit(index, newContent, attachments);
        }
    };

    return (
        <div className="chat-messages">
            {conversation.map((msg, i) => (
                <ChatSingleMessage 
                    key={i} 
                    message={msg} 
                    messageIndex={i}
                    editingMessageIndex={editingMessageIndex}
                    setEditingMessageIndex={setEditingMessageIndex}
                    onRegenerate={msg.sender === MessageSender.BOT ? () => handleRegenerate(i) : undefined}
                    onEdit={msg.sender === MessageSender.USER ? (newContent: string, attachments: TFile[]) => handleEdit(i, newContent, attachments) : undefined}
                />
            ))}
            <div ref={bottomRef}></div>
        </div>
    );
};