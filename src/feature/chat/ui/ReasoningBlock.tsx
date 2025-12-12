import { useState, useEffect, useRef, useCallback } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { MarkdownRenderer, Component } from "obsidian";
import { getApp } from "src/plugin";
import { ReasoningBlockProps } from "src/types/chat";

export default function ReasoningBlock({ reasoning, isProcessed }: ReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const componentRef = useRef<Component | null>(null);

  const cleanGoogleReasoning = useCallback((content: string): string => {
    let t = content;
    // "*"
    t = t.replace(/^\s*\*\s*$/gm, "");
    // "***Title**" → "**Title**"
    t = t.replace(/\*{3}([^*]+)\*{2}/g, "**$1**"); 
    t = t.replace(/\*{3}([^*]+)\*{3}/g, "**$1**");
    t = t.replace(/\*([^*]+)\*\*/g, "**$1**");

    // "***" or "*"
    t = t.replace(/^\*\s*(?!\s)/gm, ""); 
  
    t = t.replace(/\n{3,}/g, "\n");
    t = t.replace(/\n{2,}/g, "\n");
    return t.trim();
  }, []);

  // Handle Obsidian links
  const preprocess = useCallback((content: string): string => {
    if (!content) return "";
    // Convert [[link]] to obsidian://open?file=link
    return content.replace(".md]]", "]]").replace(/\[\[([^\]]+)\]\]/g, (_, p1) => {
      const encoded = encodeURIComponent(p1.trim());
      return `[${p1.trim()}](obsidian://open?file=${encoded})`;
    });
  }, []);

  useEffect(() => {
    const app = getApp();
    if (!contentRef.current || !isOpen || !reasoning) return;

    // Render markdown via Obsidian after preprocessing
    if (componentRef.current) {
      componentRef.current.unload();
      componentRef.current = null;
    }

    while (contentRef.current.firstChild) {
      contentRef.current.removeChild(contentRef.current.firstChild);
    }

    const container = document.createElement("div");
    contentRef.current.appendChild(container);
    
    const newComponent = new Component();
    componentRef.current = newComponent;
    
    const processed = preprocess(reasoning);
    const clean = cleanGoogleReasoning(processed);
    MarkdownRenderer.render(app, clean, container, '', newComponent);

    // Cleanup
    return () => {
      if (componentRef.current === newComponent) {
        newComponent.unload();
        componentRef.current = null;
      }
    };
  }, [reasoning, isOpen, preprocess]);

  // Check if reasoning exists and has content
  if (!reasoning || !reasoning.trim()) {
    return null;
  }

  // Only show the dropdown button when message generation is complete
  if (!isProcessed) {
    return null;
  }

  return (
    <div className="obsidian-agent__reasoning-block__container">
      <div
        className={`obsidian-agent__reasoning-block${
          isOpen ? " obsidian-agent__reasoning-block-open" : ""
        }`}
      >
        <div
          className="obsidian-agent__reasoning-block__header obsidian-agent__reasoning-block__dropdown-header obsidian-agent__cursor-pointer"
          onClick={() => setIsOpen(prev => !prev)}
        >
          <span className="obsidian-agent__reasoning-block__name">
            Reasoning summary
          </span>
          <span
            className={`obsidian-agent__reasoning-block__dropdown-arrow obsidian-agent__margin-left-auto${
              isOpen ? " obsidian-agent__reasoning-block__dropdown-arrow-open" : ""
            }`}
          >
            <ChevronRight size={14} />
          </span>
        </div>

        {isOpen && (
          <div className="obsidian-agent__animate__reasoning-block-dropdown-content">
            <div 
              ref={contentRef}
              className="obsidian-agent__reasoning-block__content"
            >
              {reasoning}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
