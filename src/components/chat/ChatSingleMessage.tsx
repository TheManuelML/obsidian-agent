import React, { useRef, useEffect, useCallback } from "react";
import { Bot, User } from "lucide-react";
import parse, { HTMLReactParserOptions, Element, domToReact } from "html-react-parser";
import { Component, MarkdownRenderer } from "obsidian";
import { MessageSender, ChatSingleMessageProps } from "src/types";

// Custom components for special tags
const CustomTag: React.FC<{ tag: string; children: React.ReactNode }> = ({ tag, children }) => (
  <span className={`custom-tag ${tag}`}>{children}</span>
);

export const ChatSingleMessage: React.FC<ChatSingleMessageProps> = ({ message }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<Component | null>(null);

  // html-react-parser options with domToReact for nested children
  const options: HTMLReactParserOptions = {
    replace: domNode => {
      if (domNode instanceof Element) {
        const customTags = ['target', 'decoy1', 'decoy2', 'ip_address', 'file', 'script_name'];
        if (customTags.includes(domNode.name)) {
          return (
            <CustomTag tag={domNode.name}>
              {domToReact(domNode.children, options)}
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

    // You can add more transformation here if needed
    console.log(linkProcessed);
    return linkProcessed;
  }, []);

  useEffect(() => {
    // If its a bot message, render markdown via Obsidian after preprocessing
    if (contentRef.current && message.sender !== MessageSender.USER) {
      contentRef.current.innerHTML = "";
      if (!componentRef.current) {
        componentRef.current = new Component();
      }
      const processed = preprocess(message.content);
      MarkdownRenderer.renderMarkdown(
        processed,
        contentRef.current,
        '',
        componentRef.current
      );
    }
    return () => {
      if (componentRef.current) {
        componentRef.current.unload();
        componentRef.current = null;
      }
    };
  }, [message.content, message.sender, preprocess]);

  return (
    <div className="chat-single-message" style={{ marginTop: "0.5rem", borderBottom: "1px solid var(--background-secondary-alt)" }}>
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ opacity: message.sender === MessageSender.USER ? 0.8 : 1, color: message.sender === MessageSender.USER ? 'var(--interactive-accent)' : 'var(--interactive-accent-hover)' }}>
          {message.sender === MessageSender.USER ? <User size={28} /> : <Bot size={28} />}
        </div>
        <span style={{ opacity: "0.8", color: 'var(--text-muted)', fontSize: 'var(--font-ui-smaller)', fontWeight: 600 }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {message.sender === MessageSender.USER ? (
        <div 
            className="user-content" 
            style={{ 
                marginTop: '0.25rem', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',  
                color: 'var(--text-normal)',
                marginBottom: '1rem' 
            }}>
          {parse(message.content, options)}
        </div>
      ) : (
        <div ref={contentRef} className="bot-content" style={{ marginTop: '0.25rem', whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--text-normal)' }} />
      )}
    </div>
  );
};
