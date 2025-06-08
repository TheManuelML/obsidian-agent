import React, { cloneElement } from "react";
import { Clipboard, Bot, SquareArrowOutUpRight, User } from "lucide-react";
import parse, { HTMLReactParserOptions, Element } from "html-react-parser";
import { marked } from "marked";
import { getApp } from "../../plugin";
import { parseCodeSnippets, parseLinkToNote } from "../../utils/parsing";
import { ChatMessagesProps, Message } from "../../types";

// Custom components for special tags
const CustomTag: React.FC<{ tag: string; children: React.ReactNode }> = ({ tag, children }) => (
    <span className={`custom-tag ${tag}`}>{children}</span>
);

export const ChatMessages: React.FC<ChatMessagesProps> = ({ conversation, isLoading, bottomRef }) => {
    const app = getApp();
    const vaultName = encodeURIComponent(app.vault.getName())

    // Copy in the clipboard a code block
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(console.error);
    };

    // Options for html-react-parser
    const options: HTMLReactParserOptions = {
        replace: (domNode) => {
            if (domNode instanceof Element && domNode.attribs) {
                // Handle custom tags
                const customTags = ['target', 'decoy1', 'decoy2', 'ip_address', 'file', 'script_name'];
                if (customTags.includes(domNode.name)) {
                    return (
                        <CustomTag tag={domNode.name}>
                            {domNode.children.map((child, index) => 
                                parse(child.toString(), options)
                            )}
                        </CustomTag>
                    );
                }
            }
        }
    };

    // Render the text to markdown
    const renderText = (text: string): React.ReactNode[] => {
        const linkFragments = parseLinkToNote(text);
    
        return linkFragments.map((frag, idx) => {
            if (frag.isLink) {
                const path = frag.text;
                const encodedPath = encodeURIComponent(path);
                const obsidianUrl = `obsidian://open?vault=${vaultName}&file=${encodedPath}`;
    
                return (
                    <a
                        key={`link-${idx}`}
                        href={obsidianUrl}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'var(--interactive-accent-hover)',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            padding: '0.1rem 0.25rem',
                            borderRadius: 'var(--radius-s)',
                            backgroundColor: 'transparent',
                        }}
                    >
                        <span>{path}</span>
                        <SquareArrowOutUpRight size={14} />
                    </a>
                );      
            } else {
                // Procesamos Markdown del fragmento y lo convertimos a JSX
                const html = marked.parse(frag.text, { async: false, breaks: true });
    
                // Convertimos el HTML en elementos React seguros con las opciones personalizadas
                return (
                    <React.Fragment key={`text-${idx}`}>
                        {parse(html, options)}
                    </React.Fragment>
                );
            }
        });
    };

    return (
        <div style={{
            flex: 1,
            overflowY: "auto",
            border: "none",
            borderRadius: "var(--radius-s)",
            padding: "0",
            backgroundColor: "var(--background-secondary)",
            marginBottom: "1rem",
        }}>
            {conversation.map((msg: Message, i: number) => (
                <div key={i} style={{
                    backgroundColor: "transparent",
                    padding: "0",
                    margin: "0.5rem 0",
                    maxWidth: "100%",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    position: "relative", 
                    userSelect: "text",
                    borderBottom: "1px solid var(--background-secondary-alt)",
                }}>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ 
                            opacity: msg.sender === 'user' 
                                ? "0.8" 
                                : "1.0",
                            color: msg.sender === 'user'
                                ? "var(--interactive-accent)"
                                : "var(--interactive-accent-hover)",
                        }}>
                            {cloneElement(msg.sender === 'user' ? <User/> : <Bot/>, { size: "28" })}
                        </div>
                        <span style={{ 
                            opacity: '0.8', 
                            color: msg.sender === 'user' ? 'var(--interactive-accent)' : 'var(--interactive-accent-hover)', 
                            fontSize: "var(--font-ui-smaller)",
                            fontWeight: "semibold",
                        }}>
                            {msg.timestamp.toString()}
                        </span>
                    </div>
                    {parseCodeSnippets(msg.content).map((frag, j) => (
                        frag.isCode ? (
                            <div key={j} style={{ position: "relative", marginTop: "0.5rem" }}>
                                <button 
                                    onClick={() => copyToClipboard(frag.text)}
                                    style={{
                                        position: "absolute",
                                        top: "0.25rem",
                                        right: "0.25rem",
                                        fontSize: "0.75rem",
                                        padding: "0.1rem 0.3rem",
                                        cursor: "pointer",
                                        color: "var(--text-muted)",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        boxShadow: "none",
                                    }}
                                >
                                    <Clipboard size={16} />
                                </button>
                                <pre 
                                    style={{
                                        fontSize: "var(--font-ui-small)",
                                        backgroundColor: "var(--background-modifier-border)",
                                        padding: "0.5rem",
                                        borderRadius: "var(--radius-s)",
                                        overflowX: "auto",
                                        margin: 0,
                                    }}
                                >
                                    {frag.text}
                                </pre>
                            </div>
                        ) : (
                            <div 
                                key={j} 
                                style={{
                                    fontSize: "var(--font-ui-small)",
                                    lineHeight: "1.5",
                                    marginTop: "0.25rem",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    opacity: "0.9",
                                    color: msg.sender === 'user' 
                                        ? "var(--text-muted)" 
                                        : "var(--text-normal)"
                                }}
                            >
                                {renderText(frag.text)}
                            </div>
                        )
                    ))}
                </div>
            ))}
            {isLoading && (
                <div style={{
                    alignSelf: "flex-start",
                    backgroundColor: "transparent",
                    color: "var(--text-normal)",
                    borderRadius: "var(--radius-s)",
                    position: "relative",
                }}>
                    <Bot size={28} style={{ stroke: "var(--interactive-accent-hover)" }}/>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "0.5rem"
                    }}>
                        <div className="typing-animation">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={bottomRef}></div>
        </div>
    );
};