import { Menu, Editor, MarkdownView } from "obsidian";
import { ObsidianAgentPlugin } from "src/plugin";
import { ensureActiveChat } from "src/feature/chat/handlers/chatHandlers";
import { handleCall } from "src/feature/chat/handlers/aiHandlers";
import { Attachment } from "src/types/chat";
import { ChatView, VIEW_TYPE_AGENT } from "src/feature/chat/View";

// Add items to the Menu
export function registerEditorMenuItems(plugin: ObsidianAgentPlugin) {
  plugin.registerEvent(
    (plugin.app.workspace as any).on(
      "editor-menu",
      (menu: Menu, editor: Editor, view: MarkdownView) => {
        const selectedText = editor.getSelection();
        if (!selectedText) return;

        // Here we add the items
        addAskAgentItem(plugin, menu, selectedText, view);
        addSummarizeItem(plugin, menu, selectedText, view);
      }
    )
  );
}

// Ask agent function
function addAskAgentItem(
  plugin: ObsidianAgentPlugin,
  menu: Menu,
  selectedText: string,
  view: MarkdownView
) {
  menu.addItem((item) =>
    item
      .setTitle("Ask agent")
      .setIcon("bot")
      .onClick(async () => {
        const currentFile = view.file;
        if (!currentFile) return;

        await plugin.activateAgentChatView();

        const chatLeaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_AGENT);
        if (chatLeaves.length === 0) return;

        const chatView = chatLeaves[0].view as ChatView;
        let activeChat = chatView.getActiveChat();
        if (!activeChat) {
          const { activeChat: newChat } = await ensureActiveChat();
          activeChat = newChat;
          if (activeChat) chatView.setActiveChat(activeChat);
        }

        if (!activeChat) return;

        const updateConversation = chatView.getUpdateConversation();
        if (!updateConversation) return;

        const attachments: Attachment[] = [{
          path: currentFile.path,
          basename: currentFile.basename,
        }];

        await handleCall(
          activeChat,
          null,
          `Explain in detail the following text:\n---\n${selectedText}\n---\n`,
          attachments,
          [],
          updateConversation,
          false
        );
      })
  );
}

// Summarize function
function addSummarizeItem(
  plugin: ObsidianAgentPlugin,
  menu: Menu,
  selectedText: string,
  view: MarkdownView
) {
  menu.addItem((item) =>
    item
      .setTitle("Summarize selection")
      .setIcon("sparkles")
      .onClick(async () => {
        const currentFile = view.file;
        if (!currentFile) return;

        await plugin.activateAgentChatView();

        const chatLeaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_AGENT);
        if (chatLeaves.length === 0) return;

        const chatView = chatLeaves[0].view as ChatView;
        const activeChat = chatView.getActiveChat();
        const updateConversation = chatView.getUpdateConversation();
        if (!activeChat || !updateConversation) return;

        const attachments: Attachment[] = [{
          path: currentFile.path,
          basename: currentFile.basename,
        }];

        await handleCall(
          activeChat,
          null,
          `Return a summary of the following text:\n---\n${selectedText}\n---\n`,
          attachments,
          [],
          updateConversation,
          false
        );
      })
  );
}
