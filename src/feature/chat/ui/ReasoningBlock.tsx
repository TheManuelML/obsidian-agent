import { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { MarkdownRenderer, Component } from "obsidian";
import { getApp } from "src/plugin";
import { ReasoningBlock, ReasoningProps } from "src/types/chat";

export default function Reasoning({ 
  reasoning, 
  isProcessed 
}: ReasoningProps) {
  const [reasoningBlocks, setReasoningBlocks] = useState<ReasoningBlock[]>([]);
  const [openBlocks, setOpenBlocks] = useState<Set<number>>(new Set());
  
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const componentRefs = useRef<(Component | null)[]>([]);
  const streamingRef = useRef<HTMLDivElement | null>(null);
  const streamingComponentRef = useRef<Component | null>(null);

  const cleanGoogleReasoning = (content: string): string => {
    let t = content;

    t = t.replace(/^\s*\*\s*$/gm, "");
  
    t = t.replace(/^\*+(?=\w)/gm, "**");
    t = t.replace(/(?<=\w)\*+$/gm, "**");
  
    t = t.replace(/\n{3,}/g, "\n\n");
  
    return t.trim();
  };

  // Handle Obsidian links
  const preprocess = (content: string): string => {
    if (!content) return "";
    // Convert [[link]] to obsidian://open?file=link
    return content.replace(".md]]", "]]").replace(/\[\[([^\]]+)\]\]/g, (_, p1) => {
      const encoded = encodeURIComponent(p1.trim());
      return `[${p1.trim()}](obsidian://open?file=${encoded})`;
    });
  };

  // Return reasoning blocks
  const getReasoningBlocks = (content: string): ReasoningBlock[] => {
    const regex = /\*\*([^*]+)\*\*/g;
    const blocks: ReasoningBlock[] = [];
    const headers: { title: string; start: number; end: number }[] = [];
  
    let match: RegExpExecArray | null;
  
    while ((match = regex.exec(content)) !== null) {
      headers.push({
        title: match[1].trim(),
        start: match.index,
        end: regex.lastIndex
      });
    }
  
    if (headers.length === 0) return [];
  
    for (let i = 0; i < headers.length; i++) {
      const { title, end } = headers[i];
      const nextStart = headers[i + 1]?.start ?? content.length;
  
      const blockContent = content.slice(end, nextStart).trim();
  
      blocks.push({ title, content: blockContent });
    }
  
    return blocks;
  };

  const toggleBlock = (index: number) => {
    setOpenBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };  

  useEffect(() => {
    if (!reasoning) {
      setReasoningBlocks([]);
      return;
    }

    const cleaned = cleanGoogleReasoning(reasoning);
    const pre = preprocess(cleaned);

    if (!isProcessed) {
      // Render streaming reasoning while the final structure is not ready
      const container = streamingRef.current;
      if (!container) return;

      container.innerHTML = "";
      streamingComponentRef.current?.unload();

      const app = getApp();
      const component = new Component();
      streamingComponentRef.current = component;

      MarkdownRenderer.render(app, pre, container, "", component);
      return;
    }

    const blocks = getReasoningBlocks(pre);
    setReasoningBlocks(blocks);
  }, [reasoning, isProcessed]);

  useEffect(() => {
    const app = getApp();
  
    reasoningBlocks.forEach((block, index) => {
      if (!openBlocks.has(index)) return;
  
      const container = contentRefs.current[index];
      if (!container) return;
  
      container.innerHTML = "";
  
      if (componentRefs.current[index]) {
        componentRefs.current[index]?.unload();
      }
  
      const component = new Component();
      componentRefs.current[index] = component;
  
      MarkdownRenderer.render(app, block.content, container, "", component);
    });
  
    return () => {
      componentRefs.current.forEach((c) => c?.unload());
    };
  }, [openBlocks, reasoningBlocks]);

  useEffect(() => {
    return () => {
      streamingComponentRef.current?.unload();
    };
  }, []);

  if (!reasoning || !reasoning.trim()) return null;

  if (!isProcessed) {
    return (
      <div className="obsidian-agent__reasoning-block__container">
        <div className="obsidian-agent__reasoning-block obsidian-agent__reasoning-block-open">
          <div className="obsidian-agent__reasoning-block__header">
            <span className="obsidian-agent__reasoning-block__name">Reasoning</span>
          </div>
          <div className="obsidian-agent__animate__reasoning-block-dropdown-content">
            <div
              ref={streamingRef}
              className="obsidian-agent__reasoning-block__content"
            ></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="obsidian-agent__reasoning-block__container">
      {reasoningBlocks.map((block, index) => (
        <div
          key={index}
          className={`obsidian-agent__reasoning-block${
            openBlocks.has(index) ? " obsidian-agent__reasoning-block-open" : ""
          }`}
        >
          <div
            className="obsidian-agent__reasoning-block__header obsidian-agent__reasoning-block__dropdown-header obsidian-agent__cursor-pointer"
            onClick={() => toggleBlock(index)}
          >
            <span className="obsidian-agent__reasoning-block__name">
              {block.title}
            </span>
            <span
              className={`obsidian-agent__reasoning-block__dropdown-arrow ${
                openBlocks.has(index) ? " obsidian-agent__reasoning-block__dropdown-arrow-open" : ""
              }`}
            >
              <ChevronRight size={14} />
            </span>
          </div>

          {openBlocks.has(index) && (
            <div className="obsidian-agent__animate__reasoning-block-dropdown-content">
              <div 
                ref={(el) => { contentRefs.current[index] = el }}
                className="obsidian-agent__reasoning-block__content"
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
