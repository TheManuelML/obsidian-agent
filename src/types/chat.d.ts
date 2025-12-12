import { TFile } from "obsidian";

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
export interface Message {
  sender: "user" | "bot" | "error";
  content: string;
  reasoning: string;
  attachments: Attachment[];
  toolCalls: ToolCall[];
  processed: boolean;
}

export interface MessageProps {
  index: number;
  message: Message;
  conversation: Message[];
  setConversation: (value: Message[] | ((prev: Message[]) => Message[])) => void;
  activeChat: TFile | null;
}

// Tools
export interface ToolCall {
  name: string;
  args?: Record<string, any>;
  response?: Record<string, any>;
}

export interface ToolCallsProps {
  toolCalls: ToolCall[];
}

// Reasoning Block
export interface ReasoningBlock {
  title: string;
  content: string;
}

export interface ReasoningProps {
  reasoning: string;
  isProcessed: boolean;
}

// Attachments
export interface Attachment {
  path: string;
  basename: string;
}

export interface AttachmentsProps {
  attachments: Attachment[];
}
