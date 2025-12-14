import { useState } from "react";
import { Code, ChevronRight, Copy, Check } from "lucide-react";
import type { ToolCallsProps } from "src/types/chat";

export default function ToolCalls({ toolCalls }: ToolCallsProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  
  const toggleIndex = (idx: number) => {
    setOpenIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleCopyResponse = (toolCallIndex: number, response: any) => {
    const text = JSON.stringify(response, null, 2);
    navigator.clipboard.writeText(text);
    const key = `${toolCallIndex}-response`;
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="obsidian-agent__tool-call__container">
      {toolCalls.map((toolCall, index) => {
        const isOpen = openIndexes.includes(index);

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
              <Code size={14} />
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
                      Arguments:
                    </div>
                    <pre className="obsidian-agent__tool-call__args-pre">
                      {JSON.stringify(toolCall.args, null, 2)}
                    </pre>
                  </div>
                )}

                {toolCall.response && (Object.keys(toolCall.response).length > 0 || toolCall.response.length > 0) && (
                  <div className="obsidian-agent__tool-call__args">
                    <div className="obsidian-agent__tool-call__result-header">
                      Response:
                      <button
                        className="obsidian-agent__tool-call__copy-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyResponse(index, toolCall.response);
                        }}
                        title="Copy response"
                      >
                        {copiedIndex === `${index}-response` ? (
                          <Check size={14} className="obsidian-agent__animate__copy-check-animate" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <pre className="obsidian-agent__tool-call__result-pre">
                      {JSON.stringify(toolCall.response, null, 2)}
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
