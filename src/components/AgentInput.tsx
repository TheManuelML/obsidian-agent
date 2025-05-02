import React, { useState, useEffect } from "react";
import { setIcon } from "obsidian";
import { callAgent } from "../backend/agent/agent";
import { Dropdown } from "./ui/Dropdown";


export const AgentInput: React.FC = () => {
  let [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [conversation, setConversation] = useState<{ sender: string, text: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const [selectedFolder, setSelectedFolder] = useState("");

  // Function to handle the message sending
  const handleSend = async () => {
    if (selectedFolder) {
      message += `\nActual directory path: ${selectedFolder}`;
    }

    try {
      // Add user message to conversation
      setConversation(prev => [...prev, { sender: "User", text: message }]);

      // Calling the agent sending the message
      const response: string = await callAgent(message, "1"); // Get thread_id from configuration
      setMessage("");

      // Add agent response to conversation
      setConversation(prev => [...prev, { sender: "Agent", text: response }]);

      console.log("Response from agent:", response);
    } catch (error: unknown) {
      console.error("Error sending message to agent:", error);
    }
  };

  // Function to handle file selection
  const handleFileChange = (type: string, files: FileList | null) => {
    if (files && files.length > 0) {
      console.log(`File ${type}:`, files[0]);
    }
  };

  // Create references for icons
  const plusIconRef = React.useRef<HTMLDivElement>(null);
  const sendIconRef = React.useRef<HTMLDivElement>(null);
  // Set icons when component mounts
  React.useEffect(() => {
    if (plusIconRef.current) {
      setIcon(plusIconRef.current, "image");
    }
    if (sendIconRef.current) {
      setIcon(sendIconRef.current, "arrow-up");
    }
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div className="chat-input__field" style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        backgroundColor: "var(--background-secondary)",
        border: "1px solid var(--background-modifier-border)",
        borderRadius: "var(--radius-s)",
        padding: "0.25rem",
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          top: "0.25rem",
          left: "0.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem"
        }}>
          <Dropdown
            value={selectedFolder}
            onChange={setSelectedFolder}
            options={[
              {"value": "Engineering", "option": "Engineering"}, 
              {"value": "Engineering/Knowledge Base", "option": "Knowledge Base"},  
              {"value": "Engineering/Knowledge Base/Artificial Intelligence", "option": "Artificial Intelligence"},
            ]}
            placeholder="Select folder"
          />
        </div>
        <textarea
          className="input"
          placeholder="Send a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: "1",
            padding: "2.5rem 0.5rem 0.5rem 0.5rem",
            fontSize: "var(--font-ui-small)",
            border: "none",
            backgroundColor: "transparent",
            borderRadius: "var(--radius-s)",
            outline: "none",
            boxShadow: "none",
            color: "var(--text-normal)",
            resize: "none",
            overflow: "hidden",
            minHeight: "2.5rem",
            maxHeight: "10rem",
            marginBottom: "2rem",
          }}
        />
        <div style={{
          position: "absolute",
          bottom: "0.25rem",
          left: "0.25rem"
        }}>
          <Dropdown
            value={selectedModel}
            onChange={setSelectedModel}
            options={[
              { value: "gemini-1.5-flash", option: "gemini-1.5-flash" },
              { value: "gemini-2.0-flash", option: "gemini-2.0-flash" },
              { value: "gemini-1.5-pro", option: "gemini-1.5-pro" }
            ]}
            placeholder="Auto"
            showClearButton={false}
          />
        </div>
        <div style={{
          position: "absolute",
          bottom: "0.25rem",
          right: "0.25rem",
          display: "flex",
          gap: "0.25rem"
        }}>
          <label className="attachment-button" style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            width: "24px",
            height: "24px",
          }}>
            <div ref={plusIconRef} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}></div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              hidden
              onChange={(e) => handleFileChange("file", e.target.files)}
            />
          </label>
          <button
            style={{
              backgroundColor: message.trim() ? "var(--interactive-accent)" : "var(--background-modifier-hover)",
              color: message.trim() ? "var(--text-on-accent)" : "var(--text-muted)",
              fontSize: "1rem",
              transition: "background-color 0.2s ease, color 0.2s ease",
              borderRadius: "100%",
              width: "24px",
              height: "24px",
              border: "none",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              cursor: message.trim() ? "pointer" : "not-allowed"
            }}
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <div style={{display: "flex", alignItems: "center", justifyContent: "center"}} ref={sendIconRef}></div>
          </button>
        </div>
      </div>
      <div className="conversation-history" style={{ marginTop: "1rem" }}>
        {conversation.map((msg, index) => (
          <div key={index} style={{
            textAlign: msg.sender === "User" ? "right" : "left",
            margin: "0.5rem 0",
            padding: "0.5rem",
            backgroundColor: msg.sender === "User" ? "var(--background-modifier-hover)" : "var(--background-secondary)",
            borderRadius: "var(--radius-s)"
          }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}; 