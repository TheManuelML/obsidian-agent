import { useEffect, useRef } from "react";
import { Message } from "src/types/index";

// Scroll to the bottom of the conversation
export const useAutoScroll = (conversation: Message[]) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  return bottomRef;
};