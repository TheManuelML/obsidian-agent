import { TFile } from "obsidian";
import { RefObject } from "react";

export enum MessageSender {    
    USER = 'user',
    BOT = 'bot'
}

export interface Message {
    sender: MessageSender.USER | MessageSender.BOT;
    content: string;
    timestamp: string;
    isErrorMessage?: boolean;
}

export interface ChatInputProps {
    onSend: (message: string, notes?: TFile[], images?: File[]) => void;
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
    isLoading: boolean;
    bottomRef: RefObject<HTMLDivElement | null>;
}