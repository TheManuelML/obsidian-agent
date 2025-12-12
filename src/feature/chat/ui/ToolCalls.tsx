import { useState } from "react";
import { FunctionCall } from "@google/genai";
import { Wrench, ChevronRight, Check, Copy } from "lucide-react";
import type { ToolCallsProps } from "src/types/chat";

export default function ToolCalls({ toolCalls }: ToolCallsProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleIndex = (idx: number) => {
    setOpenIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="obsidian-agent__tool-call__container">
      {toolCalls.map((toolCall, index) => {
        const isOpen = openIndexes.includes(index);
        const isCopied = copiedIndex === index;

        return (
          <div
            key={index}
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
                      <strong className="obsidian-agent__tool-call__args-strong">
                        Args:
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
