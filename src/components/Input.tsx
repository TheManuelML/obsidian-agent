import React, { useState, useRef } from "react";
import { SendHorizontal, AtSign, X } from "lucide-react";
import { getApp } from "../plugin";
import { TFile } from "obsidian";
import { NotePickerModal } from "../layout/NotePickerModal";

interface AgentInputProps {
  onSend: (message: string, files?: TFile[] | null) => void;
}

export const Input: React.FC<AgentInputProps> = ({ onSend }) => {
  const app = getApp();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [selectedNotes, setselectedNotes] = useState<TFile[] | null>(null);
  
  // Function to handle the message sending
  const handleSend = async () => {
    if (message.trim()) {
      onSend(message.trim(), selectedNotes); // Call the parent function to handle the message
      
      // Clear the input fields
      setMessage("");

      // Reset height
      if (textAreaRef.current) textAreaRef.current.style.height = "2.5rem";
    }
  };

  // Function to open the NotePickerModal
  const openNotePicker = () => {
    new NotePickerModal(app, (note: TFile) => {
      setselectedNotes((prev) => {
        if (prev) {
          // Avoid adding duplicate files
          if (prev.find((f) => f.path === note.path)) {
            return prev;
          }
          return [...prev, note];
        }
        return [note];
      });
    }).open();
  }

  // Function to remove a note from the selected notes
  const removeNote = (toRemove: TFile) => {
    setselectedNotes((prev) =>
      prev ? prev.filter((f) => f.path !== toRemove.path) : null
    );
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
              fontSize: "var(--font-ui-medium)",
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
          { /* Show selected notes below textarea */}
          <div style={{ marginTop: "0.25rem" }}>
            {selectedNotes && selectedNotes.length > 0 && selectedNotes.map((note) => (
              <div
                key={note.path}
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
                <span style={{ marginRight: "0.25rem" }}>{note.name.slice(0, -3)}</span>
                <button
                  onClick={() => removeNote(note)}
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
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", gap: "0.5rem" }}>
            <div>
              <button 
                onClick={openNotePicker}
                style={{
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  border: "none",
                  borderRadius: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  gap: "0.25rem",
                  cursor: "pointer",
                }}
              >
                <AtSign size={16} style={{ stroke: "var(--interactive-accent)" }}/> 
                <p style={{ fontSize: "var(--font-ui-small)", color: "var(--text-muted)" }}>Add context</p>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
              <button
                style={{
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  border: "none",
                  borderRadius: "100%",
                  width: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: message.trim() ? "pointer" : "not-allowed",
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
                  <SendHorizontal size={18} style={{ 
                    stroke: message.trim() 
                      ? "var(--interactive-accent)" 
                      : "var(--text-muted)",
                    transition: "color 0.5s ease",
                  }}/>
                </div>
              </button>
            </div>
          </div>
        </div>  
      </div>
    </div>
  );
};