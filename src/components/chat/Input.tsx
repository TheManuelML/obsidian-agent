import React, { useState, useRef } from "react";
import { AtSign, X, CircleArrowRight, Image } from "lucide-react";
import { TFile } from "obsidian";
import { getApp, getPlugin, getSettings } from "../../plugin";
import { AddContextModal } from "../modal/AddContextModal";
import { ChooseModelModal } from "../modal/ChooseModelModal";
import { ChatInputProps } from "../../types/index";
import { Model } from "src/settings/models";

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const app = getApp();
  const plugin = getPlugin();
  const settings = getSettings();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  let [selectedModel, setSelectedModel] = useState(settings.model)
  const [selectedNotes, setselectedNotes] = useState<TFile[] | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Function to handle the message sending
  const handleSend = async () => {
    if (message.trim()) {
      onSend(message.trim(), selectedNotes, selectedImages); // Call the parent function to handle the message

      // Clear the input fields
      setMessage("");
      setSelectedImages([]);
      setselectedNotes(null); // Clear selected notes after sending

      // Reset height
      if (textAreaRef.current) textAreaRef.current.style.height = "2.5rem";
    }
  };

  // Function to handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const images = event.target.files;
    if (images) {
      const newImages = Array.from(images);
      setSelectedImages(prev => [...prev, ...newImages]);
    }
    // Reset the input value so the same image can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Function to remove a image from the selected images
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Function to open the AddContextModal
  const openNotePicker = () => {
    new AddContextModal(app, (note: TFile) => {
      setselectedNotes((prev) => {
        // If no previous notes, create new array with the note
        if (!prev) return [note];
        
        // Check if note already exists
        const noteExists = prev.some((existingNote) => existingNote.path === note.path);
        if (noteExists) return prev;
        
        // Add new note to existing array
        return [...prev, note];
      });
    }).open();
  }

  // Function to open the ChooseModelModal
  const openModelPicker = () => {
    new ChooseModelModal(app, (model: Model) => {
      // Set the selected model in the settings
      settings.model = model.name;
      setSelectedModel(model.name);
      return;
    }).open();
  }

  // Function to remove a note from the selected notes
  const removeNote = (toRemove: TFile) => {
    setselectedNotes((prev) => {
      if (!prev) return null;
      
      const filteredNotes = prev.filter((note) => note.path !== toRemove.path);
      return filteredNotes.length > 0 ? filteredNotes : null;
    });
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          backgroundColor: "var(--background-secondary)",
          border: "1px solid var(--background-secondary-alt)",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.25rem",
              marginTop: "0.25rem",
            }}
          >
            {selectedNotes?.map((note) => (
              <div
                key={note.path}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "var(--background-modifier-hover)",
                  borderRadius: "var(--radius-s)",
                  padding: "0rem 0.5rem",
                  fontSize: "var(--font-ui-small)",
                  height: "1.5rem",
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
                  <X size={12} />
                </button>
              </div>
            ))}
            {/* Show selected images below textarea */}
            {selectedImages.map((img, index) => {
              const isImage = img.type.startsWith("image/");
              const previewUrl = isImage ? URL.createObjectURL(img) : null;

              return (
                <div
                  key={index}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "var(--background-modifier-hover)",
                    borderRadius: "var(--radius-s)",
                    padding: "0rem 0.5rem",
                    fontSize: "var(--font-ui-small)",
                    height: "1.5rem",
                  }}
                >
                  <img
                    src={previewUrl!}
                    alt={img.name}
                    style={{
                      width: "1rem",
                      height: "1rem",
                      objectFit: "cover",
                      borderRadius: "2px",
                      marginRight: "0.25rem",
                    }}
                  />
                  <span>Image</span>
                  <button
                    onClick={() => removeImage(index)}
                    style={{
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 0,
                      marginLeft: "0.25rem",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", gap: "0.5rem" }}>
            <div style={{ marginBottom: "0.4rem", display: "flex", gap: "0.5rem" }}>
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
                <AtSign size={16} style={{ stroke: "var(--text-muted)" }} />
                <p style={{ fontSize: "var(--font-ui-small)", color: "var(--text-muted)" }}>Add context</p>
              </button>
            </div>
            <div style={{ marginBottom: "0.4rem", display: "flex", gap: "0.5rem" }}>
              <button
                  onClick={openModelPicker}
                  style={{
                    backgroundColor: "var(--background-secondary-alt)",
                    border: "none",
                    borderRadius: "var(--radius-s)",
                    padding: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  {selectedModel}
                </button>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
              <div>
                <button
                  onClick={() => imageInputRef.current?.click()}
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
                  title="Images/Plain text"
                >
                  <Image size={18} style={{ stroke: "var(--text-muted)" }} />
                </button>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  accept=".jpg,.jpeg,.png"
                  multiple
                />
              </div>
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
                  <CircleArrowRight size={22} style={{
                    stroke: message.trim()
                      ? "var(--interactive-accent-hover)"
                      : "var(--text-muted)",
                    transform: message.trim()
                      ? "scale(1.1)"
                      : "scale(1)",
                    transition: "color 0.5s ease",

                  }} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};