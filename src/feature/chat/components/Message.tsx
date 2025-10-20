import { useCallback, useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { MarkdownRenderer, Component } from "obsidian";
import { getApp } from "src/plugin";
import Attachments from "src/feature/chat/ui/Attachments";
import ToolCalls from "src/feature/chat/ui/ToolCalls";
import Input from "src/feature/chat/components/Input";
import { MessageProps } from "src/types/chat";

export default function Message({
  index,
  message,
  conversation,
  setConversation,
  activeChat,
}: MessageProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const componentRef = useRef<Component | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  }

  // Handle Obsidian links
  const preprocess = useCallback((content: string): string => {
    // Convert [[link]] to obsidian://open?file=link
    return content.replace(".md]]", "]]").replace(/\[\[([^\]]+)\]\]/g, (_, p1) => {
      const encoded = encodeURIComponent(p1.trim());
      return `[${p1.trim()}](obsidian://open?file=${encoded})`;
    });
  }, []);
  
  useEffect(() => {
    const app = getApp();
    if (!contentRef.current || message.sender === "user") return;

    // Render markdown via Obsidian after preprocessing    
    if (componentRef.current) {
      componentRef.current.unload();
      componentRef.current = null;
    }

    while (contentRef.current.firstChild) {
      contentRef.current.removeChild(contentRef.current.firstChild);
    }

    const container = document.createElement("div");
    contentRef.current.appendChild(container);
    
    const newComponent = new Component();
    componentRef.current = newComponent;
    
    const processed = preprocess(message.content);
    MarkdownRenderer.render(app, processed, container, '', newComponent);

    // Cleanup
    return () => {
      if (componentRef.current === newComponent) {
        newComponent.unload();
        componentRef.current = null;
      }
    };
  }, [message.content, message.sender, preprocess]);

  if (message.sender === "user") {
    if (isEditing) {
      return (
        <Input
          initialValue={message.content}
          activeChat={activeChat}
          editingMessageIndex={index}
          isRegeneration={true}
          setIsEditing={setIsEditing}
          conversation={conversation}
          setConversation={setConversation}
          attachments={message.attachments}
        />
      );
    }

    return (
      <div 
        className="obsidian-agent__chat-single-message__user-message" 
        onClick={() => setIsEditing(prev => !prev)}
      >
        {/* Map the attached notes */}
        {message.attachments.length > 0 && (
          <Attachments attachments={message.attachments}/>
        )}
      
        {/* Message content */}
        <div className="obsidian-agent__chat-single-message__user-message-content">
          {message.content}
        </div>
      </div>
    );
  } 
  
  return (
    <div className="obsidian-agent__chat-single-message__bot-message">
      {/* Tool calls */}
      {message.toolCalls.length > 0 && (
        <ToolCalls toolCalls={message.toolCalls} />        
      )}
      
      {/* Message content */}
      <div 
        ref={contentRef}
        className="obsidian-agent__chat-single-message__bot-message-content"
      >
        {message.content}
      </div>

      {/* Copy button and other actions */}
      <button 
        onClick={handleCopy} 
        className="obsidian-agent__button-icon"
      >
        {copied ? <Check size={16} className="obsidian-agent__animate__copy-check-animate" /> : <Copy size={16} />}
      </button>
    </div>
  );
}