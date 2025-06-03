import React, { useState, useRef, useEffect } from "react";
import { Clipboard, Bot, User } from "lucide-react";
import { TFile } from "obsidian";
import { getApp, getPlugin } from "../plugin";
import { Input } from "./Input";
import { callAgent } from "../backend/agent";
import { parseCodeSnippets } from "../utils/parsing";
import { processAttachedFiles } from "../utils/attached_file_processing";

type Message = {
  sender: React.ReactElement;
  text: string;
  type: 'user' | 'bot';
};

export const Chat: any = () => {
  const app = getApp();
  const plugin = getPlugin();
  let language = plugin.settings.language || 'en';
  const [conversation, setConversation] = useState<Message[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addImageToState = (image: string) => {
    setSelectedImages((prev) => [...prev, image]);
  };

  const handleSend = async (message: string, notes?: TFile[] | null, files?: File[] | null) => {
    // Add user message immediately
    setConversation((prev) => [...prev, { sender: <User size={20}/>, text: message, type: 'user' }]);
    setIsLoading(true);

    let fullMessage = message;
    
    // Read attached notes
    if (notes && notes.length > 0) {
      const lang = {
        en: { file: "Note", filesIntro: "Take into account the next Obsidian notes:" },
        es: { file: "Nota", filesIntro: "Toma en cuenta las siguientes notas de Obsidian:" },
      }[language];

      if (!lang) throw new Error(`Unsupported language: ${language}`);
      fullMessage += `\n\n${lang.filesIntro}`;

      for (const note of notes) {
        const content = await app.vault.read(note);
        fullMessage += `\n[${lang.file}: ${note.name}]\n${content}`;
      }
    }

    // Read attached files
    if (files && files.length > 0) {
      const lang = {
        en: { file: "File", filesIntro: "Take into account the next attached files:" },
        es: { file: "Archivo", filesIntro: "Toma en cuenta los siguientes archivos adjuntos:" },
      }[language];

      if (!lang) throw new Error(`Unsupported language: ${language}`);
      fullMessage += `\n\n${lang.filesIntro}`;
      const fileDataList = await processAttachedFiles(files);
      
      if (fileDataList[0].type.startsWith("image/")) {
        // In the case the file is an image
        addImageToState(fileDataList[0].content);
      } else {
        // In the case the file is plain text
        for (const fileData of fileDataList) {
          fullMessage += `\n###\n[${lang.file}: ${fileData.name}]\n${fileData.content}\n###`;
        }
      }
    }

    try {
      const response = await callAgent(plugin, fullMessage, "1", selectedImages);
      setConversation((prev) => [...prev, { sender: <Bot size={20}/>, text: response, type: 'bot' }]);
    
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error processing message.";
      setConversation((prev) => [...prev, { sender: <Bot size={20}/>, text: `❌ ERROR: ${errorMessage}`, type: 'bot' }]);
      console.error("Agent error:", err);
    
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setConversation([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "1rem",
      position: "relative",
    }}
    >
      <button
        onClick={clearChat}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 1,
          padding: "0.25rem 0.75rem",
          borderRadius: "var(--radius-s)",
          backgroundColor: "var(--background-modifier-hover)",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer"
        }}
      >
        Clear chat
      </button>

      <div style={{
        flex: 1,
        overflowY: "auto",
        border: "1px solid var(--background-modifier-border)",
        borderRadius: "var(--radius-s)",
        padding: "0.5rem",
        backgroundColor: "var(--background-secondary)",
        marginTop: "2.5rem",
        marginBottom: "1rem",
      }}
      >
        {conversation.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.type === 'user' ? "flex-end" : "flex-start",
            backgroundColor: msg.type === 'user' 
              ? "var(--background-modifier-hover)" 
              : "var(--background-primary)",
            color: "var(--text-normal)",
            padding: "0.75rem",
            borderRadius: "var(--radius-s)",
            margin: "0.5rem 0",
            maxWidth: "80%",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            position: "relative", 
            userSelect: "text",
          }}>
            <strong style={{fontSize: "14px", opacity: 0.8}}>{msg.sender}</strong>
            {parseCodeSnippets(msg.text).map((frag, j) => (
              frag.isCode ? (
                <div key={j} style={{ position: "relative", marginTop: "0.5rem" }}>
                  <button 
                    onClick={() => copyToClipboard(frag.text)}
                    style={{
                      position: "absolute",
                      top: "0.25rem",
                      right: "0.25rem",
                      fontSize: "0.75rem",
                      padding: "0.1rem 0.3rem",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      backgroundColor: "none",
                    }}
                  >
                    <Clipboard size={16} />
                  </button>
                  <pre 
                    style={{
                      fontSize: "var(--font-ui-small)",
                      backgroundColor: "var(--background-modifier-border)",
                      padding: "0.5rem",
                      borderRadius: "var(--radius-s)",
                      overflowX: "auto",
                      fontFamily: "var(--font-monospace)",
                      margin: 0,
                    }}
                  >
                    {frag.text}
                  </pre>
                </div>
              ) : (
                <pre 
                  key={j} 
                  style={{
                    fontSize: "var(--font-ui-small)",
                    marginTop: "0.25rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    minHeight: "1.5em"
                  }}
                >
                  {frag.text}
                </pre>
              )
            ))}
          </div>
        ))}
        {isLoading && (
          <div style={{
            alignSelf: "flex-start",
            backgroundColor: "var(--background-primary)",
            color: "var(--text-normal)",
            padding: "0.75rem",
            borderRadius: "var(--radius-s)",
            margin: "0.5rem 0",
            maxWidth: "80%",
            position: "relative",
          }}>
            <Bot size={20}/>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem"
            }}>
              <div className="typing-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>    
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <Input onSend={handleSend}/>
      </div>  
    </div>
  );
};

const styles = `
.typing-animation {
  display: flex;
  gap: 0.3rem;
  padding: 0.5rem;
}

.typing-animation span {
  width: 8px;
  height: 8px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: typing 1s infinite ease-in-out;
}

.typing-animation span:nth-child(1) {
  animation-delay: 0.2s;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.3s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);