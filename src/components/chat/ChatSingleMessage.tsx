import React, { useRef, useEffect, useCallback } from "react";
import { Bot, User, Copy, RefreshCw } from "lucide-react";
import parse, { HTMLReactParserOptions, Element, domToReact } from "html-react-parser";
import { Component, MarkdownRenderer } from "obsidian";
import { MessageSender, ChatSingleMessageProps } from "src/types";
import { parseMarkdownCodeBlock } from "src/utils/parsing";

// Custom components for special tags
const CustomTag: React.FC<{ tag: string; children: React.ReactNode }> = ({ tag, children }) => (
  <span className={`custom-tag ${tag}`}>{children}</span>
);

export const ChatSingleMessage: React.FC<ChatSingleMessageProps & { onRegenerate?: () => void }> = ({ message, onRegenerate }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<Component | null>(null);

  const handleCopy = useCallback(() => {
    const content = message.sender === MessageSender.USER 
      ? message.content 
      : contentRef.current?.innerText || '';
    navigator.clipboard.writeText(content);
  }, [message.content, message.sender]);

  // html-react-parser options with domToReact for nested children
  const options: HTMLReactParserOptions = {
    replace: domNode => {
      if (domNode instanceof Element) {
        const customTags = ['target', 'decoy1', 'decoy2', 'ip_address', 'file', 'script_name'];
        if (customTags.includes(domNode.name)) {
          return (
            <CustomTag tag={domNode.name}>
              {domToReact(domNode.children as any, options)}
            </CustomTag>
          );
        }
      }
      return undefined;
    }
  };

  // Preprocess markdown for bot messages: handle code blocks and Obsidian links
  const preprocess = useCallback((content: string): string => {
    // Transform Obsidian links [[LinkPath]] to markdown links
    const linkProcessed = content.replace(/\[\[([^\]]+)\]\]/g, (_match, p1) => {
      const encoded = encodeURIComponent(p1.trim());
      return `[${p1.trim()}](obsidian://open?file=${encoded})`;
    }).replace(/`(\[[^\]]+\]\([^)]+\))`/g, '$1'); // Remove backsticks ``

    // Removes initial and trailing code block ```markdown ```
    const removeCodeBlock = parseMarkdownCodeBlock(linkProcessed);

    return removeCodeBlock;
  }, []);

  useEffect(() => {
    // If its a bot message, render markdown via Obsidian after preprocessing
    if (!contentRef.current || message.sender === MessageSender.USER) return;

    if (componentRef.current !== null) {
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
    MarkdownRenderer.renderMarkdown(
      processed,
      container,
      '',
      newComponent
    );

    return () => {
      if (componentRef.current === newComponent) {
        newComponent.unload();
        componentRef.current = null;
      }
    };
  }, [message.content, message.sender, preprocess]);

  // Inject inline styles for tables when mounted
  useEffect(() => {
    const styleId = "chat-table-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .bot-content table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1em;
        }
        .bot-content th,
        .bot-content td {
          border: 1px solid var(--background-modifier-border);
          padding: 0.5em;
          text-align: center;
        }
        .bot-content th {
          background-color: var(--background-secondary-alt);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="chat-single-message">
      <div className="chat-message-header">
        <div className="chat-message-info">
          <div className={`chat-message-avatar ${message.sender === MessageSender.BOT ? 'bot' : ''}`}>
            {message.sender === MessageSender.USER ? <User size={28} /> : <Bot size={28} />}
          </div>
          <span className="chat-message-timestamp">
            {message.timestamp}
          </span>
        </div>
        <div className="chat-message-actions">
          {message.sender === MessageSender.BOT && onRegenerate && (
            <button onClick={onRegenerate} className="chat-action-button">
              <RefreshCw size={16} />
            </button>
          )}
          <button onClick={handleCopy} className="chat-action-button">
            <Copy size={16} />
          </button>
        </div>
      </div>

      {message.sender === MessageSender.USER ? (
        <div className="chat-user-content">
          {parse(message.content, options)}
        </div>
      ) : (
        <div ref={contentRef} className="chat-bot-content" />
      )}
    </div>
  );
};
