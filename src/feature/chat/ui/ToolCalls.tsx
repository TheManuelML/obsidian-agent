import { useState } from "react";
import { Wrench, ChevronRight, Check, Copy } from "lucide-react";
import type { ToolCallsProps } from "src/types/chat";
import { ToolCall } from "@langchain/core/dist/messages/tool";

export default function ToolCalls({ toolCalls }: ToolCallsProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleIndex = (idx: number) => {
    setOpenIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleCopy = (toolCall: ToolCall, index: number) => {
    navigator.clipboard.writeText(JSON.stringify(toolCall.args, null, 2));
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1000);
  };

  return (
    <div className="obsidian-agent__tool-call__container">
      {toolCalls.map((toolCall, index) => {
        const isOpen = openIndexes.includes(index);
        const isCopied = copiedIndex === index;

        return (
          <div
            key={toolCall.id || index}
            className={`obsidian-agent__tool-call${
              isOpen ? " obsidian-agent__tool-call-open" : ""
            }`}
          >
            <div
              className="obsidian-agent__tool-call__header obsidian-agent__tool-call__dropdown-header obsidian-agent__cursor-pointer"
              onClick={() => toggleIndex(index)}
            >
              <Wrench size={16} />
              <span className="obsidian-agent__tool-call__name">
                {toolCall.name.replace('_', ' ')}
              </span>
              <span
                className={`obsidian-agent__tool-call__dropdown-arrow obsidian-agent__margin-left-auto${
                  isOpen ? " obsidian-agent__tool-call__dropdown-arrow-open" : ""
                }`}
              >
                <ChevronRight size={14} />
              </span>
            </div>

            {isOpen && (
              <div className="obsidian-agent__animate__tool-call-dropdown-content">
                {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                  <div className="obsidian-agent__tool-call__args">
                    <div className="obsidian-agent__tool-call__args-header">
                      <button
                        title="Copy arguments"
                        onClick={() => handleCopy(toolCall, index)}
                        className="obsidian-agent__button-icon"
                      >
                        {isCopied ? (
                          <Check
                            size={16}
                            className="obsidian-agent__animate__copy-check-animate"
                          />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <strong className="obsidian-agent__tool-call__args-strong">
                        Response:
                      </strong>
                    </div>
                    <pre className="obsidian-agent__tool-call__args-pre">
                      {JSON.stringify(toolCall.args, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
