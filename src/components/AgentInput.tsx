import React, { useState } from "react";
import { setIcon } from "obsidian";
import { callAgent } from "../backend/agent/agent";


export const AgentInput: React.FC = () => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Function to handle the message sending
  const handleSend = async () => {
    try {
      // Calling the agent sending the message
      const response: string = await callAgent(message, "1"); // Get thread_id from configuration
      setMessage("");

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
      setIcon(plusIconRef.current, "plus");
    }
    if (sendIconRef.current) {
      setIcon(sendIconRef.current, "send-horizontal");
    }
  }, []);

  return (
    <div className="chat-input__field" style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      backgroundColor: "var(--background-secondary)",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: "var(--radius-s)",
      padding: "0.25rem"
    }}>
      <label className="attachment-button" title="Add attachment" style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background-modifier-hover)",
        color: "var(--text-muted)",
        minWidth: "36px",
        height: "36px",
        marginLeft: "0.25rem",
        borderRadius: "var(--radius-s)",
        border: "none",
        transition: "background-color 0.2s ease"
      }}>
        <div ref={plusIconRef} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}></div>
        <input
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          hidden
          onChange={(e) => handleFileChange("file", e.target.files)}
        />
      </label>
      
      <input
        className="input"
        placeholder="Send a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          flex: "1",
          padding: "0.75rem 0.5rem",
          fontSize: "var(--font-ui-small)",
          border: "none",
          backgroundColor: "transparent",
          borderRadius: "var(--radius-s)",
          outline: "none",
          color: "var(--text-normal)"
        }}
      />
      
      <button
        style={{
          backgroundColor: message.trim() ? "var(--interactive-accent)" : "var(--background-modifier-hover)",
          color: message.trim() ? "var(--text-on-accent)" : "var(--text-faint)",
          fontSize: "1rem",
          transition: "background-color 0.2s ease, color 0.2s ease",
          borderRadius: "var(--radius-s)",
          minWidth: "36px",
          height: "36px",
          marginRight: "0.25rem",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: message.trim() ? "pointer" : "not-allowed"
        }}
        onClick={handleSend}
        disabled={!message.trim()}
      >
        <div ref={sendIconRef}></div>
      </button>
    </div>
  );
}; 