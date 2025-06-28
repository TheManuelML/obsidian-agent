import React, { useRef, useEffect, useCallback, useState } from "react";
import { Copy, X, Check } from "lucide-react";
import parse, { HTMLReactParserOptions, Element, domToReact } from "html-react-parser";
import { Component, MarkdownRenderer, TFile } from "obsidian";
import { getApp, getSettings } from "src/plugin";
import { MessageSender, ChatSingleMessageProps } from "src/types";
import { parseMarkdownCodeBlock } from "src/utils/parsing";
import { allAvailableModels, ModelCapability } from "src/settings/models";
import { ChatInputBase } from "src/components/chat/Input";

// Custom components for special tags
const CustomTag: React.FC<{ tag: string; children: React.ReactNode }> = ({ tag, children }) => (
  <span className={`custom-tag ${tag}`}>{children}</span>
);

interface ChatSingleMessageEditableProps extends ChatSingleMessageProps {
  onRegenerate?: () => void;
  onEdit?: (newContent: string, attachments: TFile[]) => void;
}

export const ChatSingleMessage: React.FC<ChatSingleMessageEditableProps> = ({ message, onRegenerate, onEdit }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<Component | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [editAttachments, setEditAttachments] = useState<TFile[]>(message.attachments || []);
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState(getSettings().model);
  const [canUploadImages, setCanUploadImages] = useState(() => {
    const modelObject = allAvailableModels.find(m => m.name === selectedModel);
    return modelObject?.capabilities?.includes(ModelCapability.VISION) ?? false;
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const app = getApp();

  // Poll settings changes every 2 segundos SOLO en edición
  useEffect(() => {
    if (!isEditing) return;
    const interval = setInterval(() => {
      const currentSettings = getSettings();
      if (currentSettings.model !== selectedModel) {
        setSelectedModel(currentSettings.model);
        const modelObject = allAvailableModels.find(m => m.name === currentSettings.model);
        if (modelObject?.capabilities) {
          setCanUploadImages(modelObject.capabilities.includes(ModelCapability.VISION));
          if (!modelObject.capabilities.includes(ModelCapability.VISION)) {
            setEditFiles([]);
          }
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedModel, isEditing]);

  const handleCopy = useCallback(() => {
    const content = message.sender === MessageSender.USER 
      ? message.content 
      : contentRef.current?.innerText || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
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

  // Editing user message
  const handleEditClick = () => {
    if (message.sender === MessageSender.USER) {
      setIsEditing(true);
      setEditValue(message.content);
    }
  };

  // Renderizado
  if (message.sender === MessageSender.USER) {
    if (isEditing) {
      return (
        <div style={{marginTop: '0.5rem', position: 'relative'}}>
          <button
            className="button-icon"
            style={{position: 'absolute', top: 8, right: 8, zIndex: 2}}
            onClick={() => setIsEditing(false)}
            title="Exit edit mode"
          >
            <X size={16} />
          </button>
          <ChatInputBase
            value={editValue}
            onChange={setEditValue}
            onSend={(msg, notes, files) => {
              setIsEditing(false);
              if (onEdit && msg.trim() !== message.content.trim()) {
                onEdit(msg.trim(), notes);
              }
            }}
            onCancel={() => setIsEditing(false)}
            selectedNotes={editAttachments}
            setSelectedNotes={setEditAttachments}
            selectedFiles={editFiles}
            setSelectedFiles={setEditFiles}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            canUploadImages={canUploadImages}
            setCanUploadImages={setCanUploadImages}
            imageInputRef={imageInputRef}
            app={app}
            disabled={false}
          />
        </div>
      );
    } else {
      return (
        <div className="input-container" style={{cursor: 'pointer', marginTop: 0}} onClick={handleEditClick}>
          {/* Preview of the attached notes */}
          { editAttachments.length > 0 && (
            <div className="input-context-container">
              <div className="context-row">
                {editAttachments?.map((note) => (
                  <div key={note.path} className="attachment-tag">
                    <span className="attachment-text">{note.name.slice(0, -3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Message content */}
          <div style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-normal)'}}>
            {parse(message.content, options)}
          </div>
        </div>
      );
    }
  } else {
    return (
      <div className="bot-message">
        {/* Message content */}
        <div ref={contentRef} className="bot-message-content" />
        {/* Copy button and other actions */}
        <div className="bot-message-actions">
          <button onClick={handleCopy} className="button-icon" style={{position: 'relative'}}>
            {copied ? <Check size={16} className="copy-check-animate" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
    );
  }
};