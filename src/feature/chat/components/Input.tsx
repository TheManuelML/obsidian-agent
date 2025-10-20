import { useState, useEffect, useRef } from "react";
import { AtSign, X, CircleArrowRight, Image } from "lucide-react";
import { TFile } from "obsidian";
import { getApp, getPlugin, getSettings } from "src/plugin";
import { handleCall } from "src/feature/chat/handlers/aiHandlers";
import { AddContextModal } from "src/feature/modals/AddContextModal";
import { ChooseModelModal } from "src/feature/modals/ChooseModelModal";
import { allAvailableModels } from "src/settings/models";
import { Attachment, InputProps } from "src/types/chat";
import { Model } from "src/types/ai";
import { AgentSettings } from "src/settings/SettingsTab";

export default function Input({
  initialValue,
  activeChat,
  editingMessageIndex,
  isRegeneration,
  setIsEditing,
  setConversation,
  attachments,
}: InputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<string>(initialValue);

  const [selectedModel, setSelectedModel] = useState<string>(getSettings().model);
  const [selectedNotes, setSelectedNotes] = useState<Attachment[]>(attachments);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [canUpload, setCanUpload] = useState<boolean>(false);

  useEffect(() => {
    const plugin = getPlugin();
  
    const handleSettingsUpdate = (newSettings: AgentSettings) => {
      setSelectedModel(newSettings.model);
      setCanUpload(
        allAvailableModels.find(m => m.name === newSettings.model)?.capabilities.includes("vision") ?? false
      );
    };
  
    plugin.settingsEmitter.on("settings-updated", handleSettingsUpdate);
  
    // Cleanup
    return () => {
      plugin.settingsEmitter.off("settings-updated", handleSettingsUpdate);
    };
  }, []);
  
  useEffect(() => {
    // Find the model in the list of available models and check if can upload images or not
    const model: Model = allAvailableModels.find(model => model.name === selectedModel)!;
    setCanUpload(model.capabilities.includes("vision"));
  }, [selectedModel])

  // Hanlder to send message
  const handleSendWithState = async () => {
    setMessage("");
    
    if (isRegeneration && setIsEditing) {
      setIsEditing(false);
    }

    await handleCall(
      activeChat!,
      editingMessageIndex,
      message,
      selectedNotes,
      selectedFiles,
      setConversation,
      isRegeneration,
    )
  }

  // Open the ModelPickerModal
  const openModelPicker = () => {
    const app = getApp();
    const plugin = getPlugin();
    const settings = getSettings();

    new ChooseModelModal(
      app, 
      (model: Model) => {
        // Change model in the settings and save changes
        settings.provider = model.provider;
        settings.model = model.name; 
        plugin.saveSettings();
        
        // Change the states
        setSelectedModel(model.name); 
        setCanUpload(model.capabilities.includes("vision"));
        // Clean file list if model doesn't support images
        if (!model.capabilities.includes("vision")) setSelectedFiles([]);
        
        return;
      }
    ).open();
  }

  // Open the AddContextModal
  const openNotePicker = () => {
    const app = getApp();
    new AddContextModal(
      app, 
      (note: TFile) => {
        setSelectedNotes((prev) => {
          // If no previous notes, create new array with the note
          if (!prev) return [{path: note.path, basename: note.basename}];
          // Check if note already exists in the list
          const noteExists = prev.some((existingNote) => existingNote.path === note.path);
          if (noteExists) return prev;
          // Add new note to existing array
          return [...prev, {path: note.path, basename: note.basename}];
        });
      }
    ).open();
  }
  // Removes a note from the selected notes
  const removeNote = (toRemove: Attachment) => {
    setSelectedNotes((prev) => {
      if (!prev) return [];
      
      const filteredNotes = prev.filter((note) => note.path !== toRemove.path);
      return filteredNotes;
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newfiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newfiles]);
    }
    // Reset the input value so the same image can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  // Remove a image from the selected files
  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="obsidian-agent__input__container">
      {(isRegeneration && setIsEditing) && (
        <button onClick={() => setIsEditing(false)} className="obsidian-agent__button-icon obsidian-agent__button-exit-editing">
          <X size={16}/>
        </button>
      )}

      <div className="obsidian-agent__input__context-container">
        {/* Button to add context */}
        <button 
          title="Add context"
          onClick={openNotePicker} 
          className="obsidian-agent__button-icon"
        >
          <AtSign size={16} />
        </button>
        
        {/* Show selected notes and images */}
        {selectedNotes.map((note) => (
          <div key={note.path} className="obsidian-agent__input__attachment-tag">
            <span className="obsidian-agent__input__attachment-text">{note.basename}</span>
            <button 
              onClick={() => removeNote(note)} 
              className="obsidian-agent__button-icon  obsidian-agent__width-auto"
            >
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
              <button 
                onClick={() => removeImage(index)} 
                className="obsidian-agent__button-icon obsidian-agent__width-auto"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="obsidian-agent__input__textarea-container">
        <textarea
          placeholder="Send a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendWithState();
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
              onClick={() => fileInputRef.current?.click()}
              className="obsidian-agent__button-icon"
              title={canUpload ? "Images" : "Image upload not supported by current model"}
              disabled={!canUpload}
            >
              <Image size={18} />
            </button>
            <input
              className="obsidian-agent__display-none"
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png"
              multiple
            >
            </input>
          </div>
          <button
            className="obsidian-agent__button-icon-primary"
            onClick={handleSendWithState}
            title="Send message"
            disabled={!message.trim() || !activeChat}
          >
            <CircleArrowRight size={24} />
          </button>
        </div>
      </div>
    </div> 
  );
}