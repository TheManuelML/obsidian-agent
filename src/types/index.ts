import { TFile } from "obsidian";
import { ReactElement, RefObject } from "react";

export interface Message {
    sender: ReactElement;
    text: string;
    type: 'user' | 'bot';
    timestamp: string;
}

export interface ChatInputProps {
    onSend: (message: string, notes?: TFile[] | null, images?: File[] | null) => void;
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