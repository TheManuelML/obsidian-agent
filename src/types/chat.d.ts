import { TFile } from "obsidian";
import { ToolCall } from "langchain";

// Input
export interface InputProps {
  initialValue: string;
  activeChat: TFile | null;
  editingMessageIndex: number | null;
  isRegeneration: boolean;
  setIsEditing: ((s: boolean) => void) | null;
  setConversation: (value: Message[] | ((prev: Message[]) => Message[])) => void;
  attachments: Attachment[];
}

// Chat history
export interface HistoryProps {
  activeChat: TFile | null;
  conversation: Message[];
  setConversation: (value: Message[] | ((prev: Message[]) => Message[])) => void;
}

// Chat form
export interface FormProps {
  activeChat: TFile | null;
  setActiveChat: (c: TFile | null) => void
  availableChats: TFile[];
  setAvailableChats: (c: TFile[]) => void;
}

// Message
export interface Attachment {
  path: string;
  basename: string;
}

export interface Message {
  sender: "user" | "bot" | "error";
  content: string;
  attachments: Attachment[];
  toolCalls: ToolCall[];
}

export interface MessageProps {
  index: number;
  message: Message;
  conversation: Message[];
  setConversation: (value: Message[] | ((prev: Message[]) => Message[])) => void;
  activeChat: TFile | null;
}

// Tools
export interface ToolCallsProps {
  toolCalls: ToolCall[];
}

// Attachments
export interface AttachmentsProps {
  attachments: Attachment[];
}