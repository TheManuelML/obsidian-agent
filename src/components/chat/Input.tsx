import React, { useState, useRef, useEffect } from "react";
import { AtSign, X, CircleArrowRight, Image, FileText } from "lucide-react";
import { TFile } from "obsidian";
import { getApp, getPlugin, getSettings } from "src/plugin";
import { AddContextModal } from "src/components/modal/AddContextModal";
import { ChooseModelModal } from "src/components/modal/ChooseModelModal";
import { Model, allAvailableModels, ModelCapability } from "src/settings/models";
import { ChatInputProps } from "src/types/index";

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const app = getApp();
  const settings = getSettings();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(settings.model)
  const [selectedNotes, setselectedNotes] = useState<TFile[]>([]);
  const [selectedFiles, setselectedFiles] = useState<File[]>([]);
  const [canUploadImages, setCanUploadImages] = useState(() => {
    const modelObject = allAvailableModels.find(m => m.name === settings.model);
    return modelObject?.capabilities?.includes(ModelCapability.VISION) ?? false;
  });

  // Poll settings changes every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSettings = getSettings();
      if (currentSettings.model !== selectedModel) {
        setSelectedModel(currentSettings.model);
        // Update image upload capability
        const modelObject = allAvailableModels.find(m => m.name === currentSettings.model);
        if (modelObject?.capabilities) {
          setCanUploadImages(modelObject.capabilities.includes(ModelCapability.VISION));
          // Clean file list if model doesn't support images
          if (!modelObject.capabilities.includes(ModelCapability.VISION)) {
            setselectedFiles([]);
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedModel]);

  // Function to handle the message sending to the Chat
  const handleSend = async () => {
    if (message.trim()) {
      onSend(message.trim(), selectedNotes, selectedFiles); // Call the parent function to handle the message

      // Clear the input fields
      setMessage("");
      setselectedFiles([]);

      // Reset height of the textarea
      if (textAreaRef.current) textAreaRef.current.style.height = "2.5rem";
    }
  };

  // Function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newfiles = Array.from(files);
      setselectedFiles(prev => [...prev, ...newfiles]);
    }
    // Reset the input value so the same image can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };
  // Function to remove a image from the selected files
  const removeImage = (index: number) => {
    setselectedFiles(prev => prev.filter((_, i) => i !== index));
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
  // Removes a note from the selected notes
  const removeNote = (toRemove: TFile) => {
    setselectedNotes((prev) => {
      if (!prev) return [];
      
      const filteredNotes = prev.filter((note) => note.path !== toRemove.path);
      return filteredNotes;
    });
  };

  // Function to open the ChooseModelModal
  const openModelPicker = () => {
    const plugin = getPlugin();
    const settings = getSettings();

    new ChooseModelModal(app, (model: Model) => {
      // Change model in the settings and save changes
      settings.model = model.name; 
      plugin.saveSettings();
      // Change the state
      setSelectedModel(model.name); 
      
      // Search the selected model in the model list
      const modelObject = allAvailableModels.find(m => m.name === settings.model);
      if (modelObject?.capabilities) {
        // Update image upload capability
        setCanUploadImages(modelObject.capabilities.includes(ModelCapability.VISION));
        // Clean file list if model doesn't support images
        if (!modelObject.capabilities.includes(ModelCapability.VISION)) {
          setselectedFiles([]);
        }
      }
      return;
    }).open();
  }

  

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
            {/* Show selected files below textarea */}
            {selectedFiles.map((img, index) => {
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
                  {isImage ? (
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
                  ) : (
                    <FileText
                      size={14}
                      style={{
                        marginRight: "0.25rem",
                        color: "var(--text-muted)",
                      }}
                    />
                  )}
                  <span>{img.name}</span>
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
                    cursor: canUploadImages ? "pointer" : "not-allowed",
                  }}
                  title={canUploadImages ? "Images" : "Image upload not supported by current model"}
                  disabled={!canUploadImages}
                >
                  <Image size={18} style={{
                     stroke: canUploadImages ? "var(--text-muted)" : "var(--text-error)", 
                    }} 
                  />
                </button>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleFileSelect}
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