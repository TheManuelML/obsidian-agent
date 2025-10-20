import type { AttachmentsProps } from "src/types/chat"

export default function Attachments({
  attachments
}: AttachmentsProps) {
  return (
    <div className="obsidian-agent__input__context-row">
      {attachments.map((attachment) => (
        <div key={attachment.path} className="obsidian-agent__input__attachment-tag">
          <p className="obsidian-agent__input__attachment-text">{attachment.basename}</p>
        </div>
      ))}
    </div>    
  )
}