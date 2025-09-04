import { App, Modal } from "obsidian";
import { createRoot, Root } from "react-dom/client";

function DeleteChatModalContent({
  chatName,
  onConfirm,
  onCancel,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel"
}: {
  chatName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 300 }}>
      <div style={{ whiteSpace: "pre-wrap" }}>
        Do you really want to delete chat <b>{chatName || ''}</b>?.
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="button-background" onClick={onCancel}>{cancelButtonText}</button>
        <button className="button-background button-background-primary" onClick={onConfirm}>{confirmButtonText}</button>
      </div>
    </div>
  );
}

export class DeleteChatModal extends Modal {
  private root: Root | undefined;
  private onConfirm: () => void;
  private chatName?: string;
  private confirmButtonText: string;
  private cancelButtonText: string;

  constructor(
    app: App,
    onConfirm: () => void,
    chatName?: string,
    confirmButtonText: string = "Delete",
    cancelButtonText: string = "Cancel"
  ) {
    super(app);
    this.onConfirm = onConfirm;
    this.chatName = chatName;
    this.confirmButtonText = confirmButtonText;
    this.cancelButtonText = cancelButtonText;
    
    this.setTitle("Delete chat");
  }

  onOpen() {
    const { contentEl } = this;
    this.root = createRoot(contentEl);
    const handleConfirm = () => {
      this.onConfirm();
      this.close();
    };
    const handleCancel = () => {
      this.close();
    };
    this.root.render(
      <DeleteChatModalContent
        chatName={this.chatName}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmButtonText={this.confirmButtonText}
        cancelButtonText={this.cancelButtonText}
      />
    );
  }

  onClose() {
    this.root?.unmount();
  }
}
