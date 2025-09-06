import React, { useState, useRef, useEffect } from "react";
import { AtSign, X, ArrowRight, Image } from "lucide-react";
import { TFile, App } from "obsidian";
import { getApp, getPlugin, getSettings } from "src/plugin";
import { AddContextModal } from "src/components/modal/AddContextModal";
import { ChooseModelModal } from "src/components/modal/ChooseModelModal";
import { Model, allAvailableModels, ModelCapability } from "src/settings/models";
import { ChatInputProps } from "src/types/index";

// New base reusable input component
export interface ChatInputBaseProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, notes: TFile[], files: File[]) => void;
  onCancel?: () => void;
  selectedNotes: TFile[];
  setSelectedNotes: React.Dispatch<React.SetStateAction<TFile[]>>;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  canUploadImages: boolean;
  setCanUploadImages: React.Dispatch<React.SetStateAction<boolean>>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  textAreaRef?: React.RefObject<HTMLTextAreaElement | null>;
  app: App;
  disabled?: boolean;
}

export const ChatInputBase: React.FC<ChatInputBaseProps> = ({
  value,
  onChange,
  onSend,
  onCancel,
  selectedNotes,
  setSelectedNotes,
  selectedFiles,
  setSelectedFiles,
  selectedModel,
  setSelectedModel,
  canUploadImages,
  setCanUploadImages,
  imageInputRef,
  textAreaRef,
  app,
  disabled
}) => {
  // Poll settings changes every 1 seconds
  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentSettings = getSettings();
      if (currentSettings.model !== selectedModel) {
        setSelectedModel(currentSettings.model);
        // Update image upload capability
        const modelObject = allAvailableModels.find(m => m.name === currentSettings.model);
        if (modelObject?.capabilities) {
          setCanUploadImages(modelObject.capabilities.includes(ModelCapability.VISION));
          // Clean file list if model doesn't support images
          if (!modelObject.capabilities.includes(ModelCapability.VISION)) {
            setSelectedFiles([]);
          }
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [selectedModel]);

  // Function to handle the message sending to the Chat
  const handleSend = async () => {
    if (value.trim()) {
      onSend(value.trim(), selectedNotes, selectedFiles); // Call the parent function to handle the message

      // Clear the input fields
      onChange("");
      setSelectedFiles([]);
    }
  };

  // Function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newfiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newfiles]);
    }
    // Reset the input value so the same image can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };
  // Function to remove a image from the selected files
  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Function to open the AddContextModal
  const openNotePicker = () => {
    new AddContextModal(app, (note: TFile) => {
      setSelectedNotes((prev) => {
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
    setSelectedNotes((prev) => {
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
      settings.provider = model.provider;
      settings.model = model.name; 
      
      plugin.saveSettings();
      
      // Change the state
      setSelectedModel(model.name); 
      
      // Search the selected model in the model list
      if (model.capabilities) {
        // Update image upload capability
        setCanUploadImages(model.capabilities.includes(ModelCapability.VISION));
        // Clean file list if model doesn't support images
        if (!model.capabilities.includes(ModelCapability.VISION)) {
          setSelectedFiles([]);
        }
      }
      return;
    }).open();
  }

  return (
    <div className="obsidian-agent__input__container">
      <div className="obsidian-agent__input__context-container">
        <div className="obsidian-agent__input__context-row">
          {/* Button to add context */}
          <button onClick={openNotePicker} className={(selectedNotes.length === 0 && selectedFiles.length === 0) ? ".obsidian-agent__input__context-button" : "obsidian-agent__button-icon"}>
            <AtSign size={16} />
            {(selectedNotes.length === 0 && selectedFiles.length === 0) && <p>Add context</p>}
          </button>

          {/* Show selected notes and images */}
          {selectedNotes.map((note) => (
            <div key={note.path} className="obsidian-agent__input__attachment-tag">
              <span className="obsidian-agent__input__attachment-text">{note.name.slice(0, -3)}</span>
              <button onClick={() => removeNote(note)} className="obsidian-agent__button-icon  obsidian-agent__width-auto">
                <X size={12} />
              </button>
            </div>
          ))}
          {selectedFiles.map((img, index) => {
            const previewUrl = URL.createObjectURL(img);
            return (
              <div key={index} className="obsidian-agent__input__attachment-tag">
                <img src={previewUrl!} alt={img.name} className="obsidian-agent__input__attachment-image"/>
                <span className="obsidian-agent__input__attachment-text">{img.name}</span>
                <button onClick={() => removeImage(index)} className="obsidian-agent__button-icon obsidian-agent__width-auto">
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="obsidian-agent__input__textarea-container">
        <textarea
          ref={textAreaRef}
          placeholder="Send a message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="obsidian-agent__input__textarea"
        />
      </div>
      <div className="obsidian-agent__input__actions">
        <button onClick={openModelPicker} className="obsidian-agent__input__model-button">
          {selectedModel}
        </button>
        <div className="obsidian-agent__input__right-actions">
          <div>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="obsidian-agent__button-icon"
              title={canUploadImages ? "Images" : "Image upload not supported by current model"}
              disabled={!canUploadImages}
            >
              <Image size={18} />
            </button>
            <input
              className="obsidian-agent__display-none"
              type="file"
              ref={imageInputRef}
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png"
              multiple
            />
          </div>
          <button
            className="obsidian-agent__button-icon-primary"
            onClick={handleSend}
            title="Send message"
            disabled={!value.trim()}
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div> 
  );
};

// ChatInput ahora usa ChatInputBase
export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const app = getApp();
  const settings = getSettings();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(settings.model)
  const [selectedNotes, setSelectedNotes] = useState<TFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [canUploadImages, setCanUploadImages] = useState(() => {
    const modelObject = allAvailableModels.find(m => m.name === settings.model);
    return modelObject?.capabilities?.includes(ModelCapability.VISION) ?? false;
  });

  return (
    <ChatInputBase
      value={message}
      onChange={setMessage}
      onSend={(msg, notes, files) => {
        onSend(msg, notes, files);
        setMessage("");
        setSelectedFiles([]);
      }}
      selectedNotes={selectedNotes}
      setSelectedNotes={setSelectedNotes}
      selectedFiles={selectedFiles}
      setSelectedFiles={setSelectedFiles}
      selectedModel={selectedModel}
      setSelectedModel={setSelectedModel}
      canUploadImages={canUploadImages}
      setCanUploadImages={setCanUploadImages}
      imageInputRef={imageInputRef}
      textAreaRef={textAreaRef}
      app={app}
    />
  );
};