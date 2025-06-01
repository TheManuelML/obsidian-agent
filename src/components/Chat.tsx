import React, { useState, useRef, useEffect } from "react";
import { ObsidianAgentPlugin, getApp } from "../plugin";
import { callAgent } from "../backend/agent";
import { Input } from "./Input";
import { parseCodeSnippets } from "../utils/sanitize";
import { Clipboard } from "lucide-react";
import { TFile } from "obsidian";

interface AgentChatProps {
  plugin: ObsidianAgentPlugin;
}

export const Chat: React.FC<AgentChatProps> = ({ plugin }) => {
  const app = getApp();
  const [conversation, setConversation] = useState<{ sender: string, text: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = async (message: string, files?: TFile[] | null) => {
    let fullMessage = message;
    if (files && files.length > 0) {
      fullMessage += `\n\nTake into account the next files:`;
      for (const file of files) {
        const content = await app.vault.read(file)
        fullMessage += `\n[File: ${file.path}]\n${content}`;
      }
    };

    try {
      const response = await callAgent(plugin, fullMessage, "1");
      setConversation((prev) => [
        ...prev, 
        { sender: "User", text: message }, 
        { sender: "Agent", text: response }
      ]);
    } catch (err) {
      setConversation((prev) => [...prev, { sender: "Agent", text: "Error processing message." }]);
      console.error("Agent error:", err);
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
            alignSelf: msg.sender === "User" ? "flex-end" : "flex-start",
            backgroundColor: msg.sender === "User" 
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
            <strong style={{fontSize: "14px", opacity: 0.8}}>{msg.sender}:</strong>
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
                      fontSize: "12px",
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
                    fontSize: "12px",
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
        <div ref={bottomRef}></div>
      </div>    
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <Input onSend={handleSend}/>
      </div>  
    </div>
  );
};
