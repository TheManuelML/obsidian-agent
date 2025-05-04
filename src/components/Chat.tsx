// Expandir verticalmente el bloque de mensaje cuando el mensaje sea largo
// Si e mensaje esta entre ``` no expandir el bloque verticalmente, añadir un scroll horizontal
// Si el mensaje es un bloque de codigo cambiar el color de fondo y el color del texto

import React, { useState, useRef, useEffect } from "react";
import { callAgent } from "../backend/agent";
import { AgentInput } from "./Input";
import { ObsidianAgentPlugin } from "../plugin";

interface AgentChatProps {
  plugin: ObsidianAgentPlugin;
}

export const AgentChat: React.FC<AgentChatProps> = ({ plugin }) => {
  const [conversation, setConversation] = useState<{ sender: string, text: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = async (message: string, folder?: string) => {
    let fullMessage = message;
    if (folder) {
      fullMessage += `\nActual directory path: ${folder}`;
    }

    try {
      const response = await callAgent(plugin, fullMessage, "1");
      setConversation(prev => [...prev, { sender: "User", text: message }, { sender: "Agent", text: response }]);
    } catch (err) {
      setConversation(prev => [...prev, { sender: "Agent", text: "Error processing message." }]);
      console.error("Agent error:", err);
    }
  };

  const clearChat = () => setConversation([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "1rem",
      gap: "1rem",
      marginBottom: "1rem",
    }}>
      <button
        onClick={clearChat}
        style={{
          alignSelf: "flex-end",
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
        flex: "1",
        overflowY: "auto",
        border: "1px solid var(--background-modifier-border)",
        borderRadius: "var(--radius-s)",
        padding: "0.5rem",
        backgroundColor: "var(--background-secondary)"
      }}>
        {conversation.map((msg, i) => (
          <div key={i} style={{
            textAlign: msg.sender === "User" ? "right" : "left",
            backgroundColor: msg.sender === "User" ? "var(--background-modifier-hover)" : "var(--background-primary)",
            color: "var(--text-normal)",
            padding: "0.5rem",
            borderRadius: "var(--radius-s)",
            margin: "0.5rem 0",
            maxWidth: "80%",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word", 
            marginLeft: msg.sender === "User" ? "auto" : undefined,
            userSelect: "text",
          }}>
            <strong style={{fontSize: "14px"}}>{msg.sender}:</strong>
            <pre style={{fontSize: "12px"}}>{msg.text}</pre>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>
      <AgentInput plugin={plugin} onSend={handleSend}/>
    </div>
  );
};
