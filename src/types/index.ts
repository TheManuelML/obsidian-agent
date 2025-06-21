import { TFile } from "obsidian";
import { RefObject } from "react";

export enum MessageSender {    
    USER = 'user',
    BOT = 'bot'
}

export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, any>;
    result?: string;
    status: 'pending' | 'success' | 'error';
}

export interface Message {
    sender: MessageSender.USER | MessageSender.BOT;
    content: string;
    timestamp: string;
    attachments?: {
        notes?: TFile[];
        files?: File[];
    };
    toolCalls?: ToolCall[];
}

export interface ChatInputProps {
    onSend: (message: string, notes?: TFile[], files?: File[]) => void;
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
}

export interface ChatSingleMessageProps {
    message: Message;
}