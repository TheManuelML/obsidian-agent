import { TFile } from "obsidian";
import { ReactElement, RefObject } from "react";

// Types / Structures //
export interface Message {
    sender: ReactElement;
    text: string;
    type: 'user' | 'bot';
    timestamp: string;
}

// Interfaces //
export interface AgentInputProps {
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

export interface MessageListProps {
    conversation: Message[];
    isLoading: boolean;
    bottomRef: RefObject<HTMLDivElement | null>;
}