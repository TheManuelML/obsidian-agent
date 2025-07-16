import { TFile } from "obsidian";
import { RefObject, Dispatch, SetStateAction } from "react";

export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, any>;
    result?: string;
    status: "pending" | "success" | "error";
}

export enum MessageSender {    
    USER = 'user',
    BOT = 'bot'
}

export interface Message {
    sender: MessageSender.USER | MessageSender.BOT;
    content: string;
    attachments: TFile[];
    toolCalls?: ToolCall[];
}

export interface ChatInputProps {
    onSend: (message: string, notes: TFile[], files: File[]) => void;
}

export interface ChatFormProps {
    chatFile: TFile | null;
    chatFiles: TFile[];
    setChatFile: (file: TFile | null) => void;
    setConversation: (conversation: Message[]) => void;
    loadChatFiles: () => Promise<TFile[]>;
    handleCreateChat: () => void;
}

export interface ChatMessagesProps {
    conversation: Message[];
    bottomRef: RefObject<HTMLDivElement | null>;
    editingMessageIndex: number | null;
    setEditingMessageIndex: Dispatch<SetStateAction<number | null>>;
}

export interface ChatSingleMessageProps {
    message: Message;
    editingMessageIndex: number | null;
    setEditingMessageIndex: Dispatch<SetStateAction<number | null>>;
    messageIndex: number;
}