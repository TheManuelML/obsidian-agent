import { useState } from "react";
import { Wrench, ChevronRight } from "lucide-react";
import type { ToolCallsProps } from "src/types/chat";

export default function ToolCalls({
  toolCalls
}: ToolCallsProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleIndex = (idx: number) => {
    setOpenIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="obsidian-agent__tool-call__container">
      {toolCalls.map((toolCall, index) => {
        const isOpen = openIndexes.includes(index);
        
        return (
          <div key={toolCall.id || index} className={`obsidian-agent__tool-call` + (isOpen ? ' obsidian-agent__tool-call-open' : '')}>
            <div className="obsidian-agent__tool-call__header obsidian-agent__tool-call__dropdown-header obsidian-agent__cursor-pointer" onClick={() => toggleIndex(index)}>
              <Wrench size={16} />
              <span className="obsidian-agent__tool-call__name">{toolCall.name}</span>
              <span className={`obsidian-agent__tool-call__dropdown-arrow obsidian-agent__margin-left-auto` + (isOpen ? ' obsidian-agent__tool-call__dropdown-arrow-open' : '')}>
                <ChevronRight size={14} />
              </span>
            </div>
            {isOpen && (
              <div className="obsidian-agent__animate__tool-call-dropdown-content">
                {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                  <div className="obsidian-agent__tool-call__args">
                    <strong className="obsidian-agent__tool-call__args-strong">Arguments:</strong>
                    <pre className="obsidian-agent__tool-call__args-pre">{JSON.stringify(toolCall.args, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}