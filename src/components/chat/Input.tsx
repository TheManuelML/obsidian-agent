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
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        <div className="chat-input-textarea-container">
          <textarea
            ref={textAreaRef}
            placeholder="Send a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="chat-input-textarea"
          />
          {/* Show selected notes below textarea */}
          <div className="chat-input-attachments">
            {selectedNotes?.map((note) => (
              <div key={note.path} className="chat-attachment-tag">
                <span className="chat-attachment-text">{note.name.slice(0, -3)}</span>
                <button onClick={() => removeNote(note)} className="chat-attachment-remove">
                  <X size={12} />
                </button>
              </div>
            ))}
            {/* Show selected files below textarea */}
            {selectedFiles.map((img, index) => {
              const isImage = img.type.startsWith("image/");
              const previewUrl = isImage ? URL.createObjectURL(img) : null;

              return (
                <div key={index} className="chat-attachment-tag">
                  {isImage ? (
                    <img
                      src={previewUrl!}
                      alt={img.name}
                      className="chat-attachment-image"
                    />
                  ) : (
                    <FileText size={14} className="chat-attachment-icon" />
                  )}
                  <span>{img.name}</span>
                  <button
                    onClick={() => removeImage(index)}
                    className="chat-attachment-remove chat-attachment-remove-with-margin"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="chat-input-actions">
            <div className="chat-input-left-actions">
              <button onClick={openNotePicker} className="chat-context-button">
                <AtSign size={16} className="chat-context-icon" />
                <p className="chat-context-text">Add context</p>
              </button>
            </div>
            <div className="chat-input-left-actions">
              <button onClick={openModelPicker} className="chat-model-button">
                {selectedModel}
              </button>
            </div>
            <div className="chat-input-right-actions">
              <div>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="chat-upload-button"
                  title={canUploadImages ? "Images" : "Image upload not supported by current model"}
                  disabled={!canUploadImages}
                >
                  <Image 
                    size={18} 
                    className={`chat-upload-icon ${!canUploadImages ? 'disabled' : ''}`}
                  />
                </button>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleFileSelect}
                  className="chat-file-input"
                  accept=".jpg,.jpeg,.png"
                  multiple
                />
              </div>
              <button
                className="chat-send-button"
                onClick={handleSend}
                disabled={!message.trim()}
                title="Send message"
              >
                <div className="chat-send-button-inner">
                  <CircleArrowRight 
                    size={22} 
                    className={`chat-send-icon ${message.trim() ? 'active' : ''}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};