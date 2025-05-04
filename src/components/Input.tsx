import React, { useState, useEffect, useRef } from "react";
import { setIcon } from "obsidian";
import { Dropdown } from "./ui/Dropdown";
import { ObsidianAgentPlugin, getApp } from "../plugin";
import { getFiles, getFolders } from "../utils/files";

interface AgentInputProps {
  plugin: ObsidianAgentPlugin;
  onSend: (message: string, folder?: string) => void;
}

export const AgentInput: React.FC<AgentInputProps> = ({ plugin, onSend }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");

  const [isFocused, setIsFocused] = useState(false);

  // List available folders
  const folderList = [
    ...getFolders(getApp().vault).map(folder => ({
      value: folder.path,
      option: folder.name
    })), 
      {value: "", option: "None"}
  ];

  // Function to handle the message sending
  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim(), selectedFolder); // Call the parent function to handle the message
      setMessage(""); // Clear the input field
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "2.5rem"; // Reset height
      }
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
    <div style={{ position: "relative", padding: "0.5rem" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        backgroundColor: "var(--background-secondary)",
        border: "1px solid var(--background-modifier-border)",
        borderRadius: "var(--radius-s)",
        padding: "0.25rem",
        position: "relative"
      }}>
        <textarea
          ref={textAreaRef}
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
            padding: "0.5rem 0.5rem 0.5rem 0.5rem",
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
        <div style={{position: "absolute", bottom: "0.25rem", left: "0.25rem"}}>
          <Dropdown
            value={selectedFolder}
            onChange={setSelectedFolder}
            options={folderList}
            placeholder="Select folder"
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
          <label style={{
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
    </div>
  );
}; 