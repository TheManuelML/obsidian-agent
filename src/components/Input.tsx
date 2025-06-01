import React, { useState, useRef } from "react";
import { SendHorizontal, Image, AtSign, X } from "lucide-react";
import { getApp } from "../plugin";
import { TFile } from "obsidian";
import { FilePickerModal } from "../layout/FilePickerModal";

interface AgentInputProps {
  onSend: (message: string, files?: TFile[] | null) => void;
}

export const Input: React.FC<AgentInputProps> = ({ onSend }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<TFile[] | null>(null);

  const app = getApp();

  // Function to handle the message sending
  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim(), selectedFiles); // Call the parent function to handle the message
      setMessage(""); // Clear the input field
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "2.5rem"; // Reset height
      }
    }
  };

  // Function to open the FilePickerModal
  const openFilePicker = () => {
    new FilePickerModal(app, (file: TFile) => {
      setSelectedFiles((prev) => {
        if (prev) {
          // Avoid adding duplicate files
          if (prev.find((f) => f.path === file.path)) {
            return prev;
          }
          return [...prev, file];
        }
        return [file];
      });
    }).open();
  }

  // Function to remove a file from the selected files
  const removeFile = (toRemove: TFile) => {
    setSelectedFiles((prev) =>
      prev ? prev.filter((f) => f.path !== toRemove.path) : null
    );
  };

  // Function to handle file selection
  const handleFileChange = (type: string, files: FileList | null) => {
    if (files && files.length > 0) {
      console.log(`File ${type}:`, files[0]);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div 
        style={{
          display: "flex",
          alignItems: "flex-end",
          backgroundColor: "var(--background-secondary)",
          border: "1px solid var(--background-modifier-border)",
          borderRadius: "var(--radius-s)",
          gap: "0.5rem",
          padding: "0.5rem",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
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
            style={{
              flex: "1",
              padding: "0.5rem",
              fontSize: "var(--font-ui-small)",
              border: "none",
              backgroundColor: "transparent",
              borderRadius: "var(--radius-s)",
              outline: "none",
              boxShadow: "none",
              color: "var(--text-normal)",
              resize: "none",
              overflow: "auto",
              minHeight: "2.5rem",
              maxHeight: "10rem",
            }}
          />
          { /* Show selected files below textarea */}
          {selectedFiles && selectedFiles.length > 0 && (
            <div style={{ marginTop: "0.25rem" }}>
              {selectedFiles.map((file) => (
                <div
                  key={file.path}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "var(--background-modifier-hover)",
                    borderRadius: "var(--radius-s)",
                    padding: "0rem 0.5rem",
                    marginRight: "0.25rem",
                    marginBottom: "0.25rem",
                    fontSize: "var(--font-ui-small)",
                  }}
                >
                  <span style={{ marginRight: "0.25rem" }}>{file.name.slice(0, -3)}</span>
                  <button
                    onClick={() => removeFile(file)}
                    style={{
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 0,
                    }}
                  >
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", gap: "0.5rem" }}>
            <div>
              <button 
                onClick={openFilePicker}
                style={{
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  border: "none",
                  borderRadius: "100%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  cursor: "pointer",
                }}
                title="Add context"
              >
                <AtSign size={16}/>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
              <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Image size={16}/>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  hidden
                  onChange={(e) => handleFileChange("file", e.target.files)}
                />
              </label>
              <button
                style={{
                  backgroundColor: message.trim() 
                    ? "var(--interactive-accent)" 
                    : "var(--background-modifier-hover)",
                  border: "1px solid var(--background-modifier-border)",
                  borderRadius: "100%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: message.trim() ? "pointer" : "not-allowed",
                  transition: "background-color 0.2s ease, color 0.2s ease",
                  padding: 0
                }}
                onClick={handleSend}
                disabled={!message.trim()}
                title="Send message"
              >
                <div 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                  }}
                >
                  <SendHorizontal size={14} style={{ stroke: message.trim() ? "var(--text-on-accent)" : "var(--text-muted)" }}/>
                </div>
              </button>
            </div>
          </div>
        </div>  
      </div>
    </div>
  );
};