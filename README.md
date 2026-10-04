<h1 align="center">Obsidian Agent</h1>

<p align="center">
  Lend your vault to an AI agent. Read, write, and search your notes with AI.<br/>
</p>

<div align="center">
  <div>
    <img src="https://img.shields.io/badge/Obsidian-%23483699.svg?&logo=obsidian&logoColor=white" alt="Obsidian">
    <img src="https://img.shields.io/badge/Google%20Gemini-886FBF?logo=googlegemini&logoColor=fff" alt="Google Gemini">
    <img src="https://img.shields.io/badge/Claude-D97757?logo=claude&logoColor=fff" alt="Claude">
    <img src="https://img.shields.io/badge/OpenAI-10A37F?logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9IiNmZmZmZmYiIHdpZHRoPSI4MDBweCIgaGVpZ2h0PSI4MDBweCIgdmlld0JveD0iMCAwIDI0IDI0IiByb2xlPSJpbWciIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIwLjAwMDI0MDAwMDAwMDAwMDAwMDAzIj4KICA8ZyBpZD0iU1ZHUmVwb19iZ0NhcnJpZXIiIHN0cm9rZS13aWR0aD0iMCI+PC9nPgogIDxnIGlkPSJTVkdSZXBvX3RyYWNlckNhcnJpZXIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PC9nPgogIDxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4KICAgIDx0aXRsZT5PcGVuQUkgaWNvbjwvdGl0bGU+CiAgICA8cGF0aCBkPSJNMjIuMjgxOSA5LjgyMTFhNS45ODQ3IDUuOTg0NyAwIDAgMC0uNTE1Ny00LjkxMDggNi4wNDYyIDYuMDQ2MiAwIDAgMC02LjUwOTgtMi45QTYuMDY1MSA2LjA2NTEgMCAwIDAgNC45ODA3IDQuMTgxOGE1Ljk4NDcgNS45ODQ3IDAgMCAwLTMuOTk3NyAyLjkgNi4wNDYyIDYuMDQ2MiAwIDAgMCAuNzQyNyA3LjA5NjYgNS45OCA1Ljk4IDAgMCAwIC41MTEgNC45MTA3IDYuMDUxIDYuMDUxIDAgMCAwIDYuNTE0NiAyLjkwMDFBNS45ODQ3IDUuOTg0NyAwIDAgMCAxMy4yNTk5IDI0YTYuMDU1NyA2LjA1NTcgMCAwIDAgNS43NzE4LTQuMjA1OCA1Ljk4OTQgNS45ODk0IDAgMCAwIDMuOTk3Ny0yLjkwMDEgNi4wNTU3IDYuMDU1NyAwIDAgMC0uNzQ3NS03LjA3Mjl6bS05LjAyMiAxMi42MDgxYTQuNDc1NSA0LjQ3NTUgMCAwIDEtMi44NzY0LTEuMDQwOGwuMTQxOS0uMDgwNCA0Ljc3ODMtMi43NTgyYS43OTQ4Ljc5NDggMCAwIDAgLjM5MjctLjY4MTN2LTYuNzM2OWwyLjAyIDEuMTY4NmEuMDcxLjA3MSAwIDAgMSAuMDM4LjA1MnY1LjU4MjZhNC41MDQgNC41MDQgMCAwIDEtNC40OTQ1IDQuNDk0NHptLTkuNjYwNy00LjEyNTRhNC40NzA4IDQuNDcwOCAwIDAgMS0uNTM0Ni0zLjAxMzdsLjE0Mi4wODUyIDQuNzgzIDIuNzU4MmEuNzcxMi43NzEyIDAgMCAwIC43ODA2IDBsNS44NDI4LTMuMzY4NXYyLjMzMjRhLjA4MDQuMDgwNCAwIDAgMS0uMDMzMi4wNjE1TDkuNzQgMTkuOTUwMmE0LjQ5OTIgNC40OTkyIDAgMCAxLTYuMTQwOC0xLjY0NjR6TTIuMzQwOCA3Ljg5NTZhNC40ODUgNC40ODUgMCAwIDEgMi4zNjU1LTEuOTcyOFYxMS42YS43NjY0Ljc2NjQgMCAwIDAgLjM4NzkuNjc2NWw1LjgxNDQgMy4zNTQzLTIuMDIwMSAxLjE2ODVhLjA3NTcuMDc1NyAwIDAgMS0uMDcxIDBsLTQuODMwMy0yLjc4NjVBNC41MDQgNC41MDQgMCAwIDEgMi4zNDA4IDcuODcyem0xNi41OTYzIDMuODU1OEwxMy4xMDM4IDguMzY0IDE1LjExOTIgNy4yYS4wNzU3LjA3NTcgMCAwIDEgLjA3MSAwbDQuODMwMyAyLjc5MTNhNC40OTQ0IDQuNDk0NCAwIDAgMS0uNjc2NSA4LjEwNDJ2LTUuNjc3MmEuNzkuNzkgMCAwIDAtLjQwNy0uNjY3em0yLjAxMDctMy4wMjMxbC0uMTQyLS4wODUyLTQuNzczNS0yLjc4MThhLjc3NTkuNzc1OSAwIDAgMC0uNzg1NCAwTDkuNDA5IDkuMjI5N1Y2Ljg5NzRhLjA2NjIuMDY2MiAwIDAgMSAuMDI4NC0uMDYxNWw0LjgzMDMtMi43ODY2YTQuNDk5MiA0LjQ5OTIgMCAwIDEgNi42ODAyIDQuNjZ6TTguMzA2NSAxMi44NjNsLTIuMDItMS4xNjM4YS4wODA0LjA4MDQgMCAwIDEtLjAzOC0uMDU2N1Y2LjA3NDJhNC40OTkyIDQuNDk5MiAwIDAgMSA3LjM3NTctMy40NTM3bC0uMTQyLjA4MDVMOC43MDQgNS40NTlhLjc5NDguNzk0OCAwIDAgMC0uMzkyNy42ODEzem0xLjA5NzYtMi4zNjU0bDIuNjAyLTEuNDk5OCAyLjYwNjkgMS40OTk4djIuOTk5NGwtMi41OTc0IDEuNDk5Ny0yLjYwNjctMS40OTk3WiI+PC9wYXRoPgogIDwvZz4KPC9zdmc+Cg==" alt="OpenAI">
    <img src="https://img.shields.io/badge/Ollama-FFFFFF?logo=ollama&logoColor=000" alt="Ollama">
  </div>
  <div>
    <img src="https://img.shields.io/badge/Licence-MIT-D93192" alt="Release">
	<a href="https://coff.ee/themanuelml" style="text-decoration: none">
      <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?&logo=buy-me-a-coffee&logoColor=black" alt="Buy mea coffe">
    </a>
    <img src="https://img.shields.io/github/stars/TheManuelML/obsidian-agent?style=social" alt="GitHub stars">
  </div>
</div>

## 🚀 Overview
A simple and lightweight AI extension for Obsidian. Connect Google Gemini, Anthropic Claude, OpenAI, OpenRouter, or a local Ollama model, and delegate basic tasks to an agent that can write, edit, and create notes and folders within your vault.

It features a user-friendly UI, inspired by other agentic apps.

![main UI](./imgs/demo.png)


## 🧠 Getting Started

1. Clone the repository inside your `~/vault/.obsidian/plugins/` folder.
2. Enable the plugin from Obsidian's settings panel.
3. In the plugin's settings panel, choose your AI provider (Google, Anthropic, OpenAI, OpenRouter, or Ollama) and add the corresponding credentials.

> [!IMPORTANT]  
> - For **Google**, **Anthropic**, **OpenAI**, and **OpenRouter**, make sure you have a valid API key for the selected provider.
> - For **OpenRouter**, use OpenRouter's `vendor/model` names (e.g. `anthropic/claude-sonnet-5.5`).
> - For **Ollama**, no API key is needed, just make sure your local Ollama server is running and the model has been pulled.
> - You can also add a custom base URL to connect to a different endpoint for the selected provider.

Start chating with the agent by locating  and clicking on the brain icon in the left and right sidebars. Or add a hotkey to kickly acces your most recent chat.

![hotkeys](./imgs/hotkeys.png)

## 💬 Chats

Manage your chats as Obsidian notes. Rename the chat by renaming the file.

![chat-management](./imgs/manage-chats.png)

> [!CAUTION]  
> Chat files are design to store the chat history and the messages metadata. Do not modify or move them.

## 🛠️ Tools

The agent can use the following tools to interact with your vault:

- **Create note**: Create a new note in your vault.   
e.g: *Create a note titled 'Project Ideas'*
- **Read note**: Read the content of a note.  
e.g: *Read the active note*
- **Edit note**: Edit an existing note.  
e.g: *Add a summary of this text: [...] to the note 'Book Review'*
- **Create folder**: Create a new folder.  
e.g: *Create a folder called '2024 Plans'*
- **List files**: List files in a folder.  
e.g: *List all files in the folder 'Research'*
- **Vault Search**: Search for content across your vault.  
e.g: *Search if it exist a note called 'AI agent'*
- **Note filtering**: Return note paths that fall inside a date range.  
e.g: *Give me yesterday's notes*
- **Web search**: Search for content on the web. Not available with OpenRouter or Ollama models.  
e.g: *Search on the web for todays temperature in Austin, Texas*

Also you can right click over selected text, in your markdown notes, to `summarize selection` or `ask agent`.

<img height=400 src="./imgs/action-menu.png" alt="Obsidian">

And finally, you can also attach images by clicking the image icon, and notes with the `@` icon in the input.

## 🟡 Disclosures
This plugin can connect to remote AI services (Google Gemini, Anthropic Claude, OpenAI, or OpenRouter) to process your requests, or to a local Ollama instance.

> **Why is this needed?**  
> The AI models that power these features run on external servers and require an internet connection, with the exception of Ollama, which runs locally on your machine. Your notes or queries are sent securely to the selected provider for processing, and the results are only returned to your vault.

To use Google, Anthropic, OpenAI, or OpenRouter, you must set the corresponding API key. You are responsible for obtaining and managing your API keys. Ollama does not require an API key, but does require a local Ollama installation.

**Network usage in detail:**

- Your messages, the notes and images you attach, and any note content the agent reads with its tools are sent to the AI provider you selected (Google, Anthropic, OpenAI, or OpenRouter, which forwards it to the model's vendor) — or stay on your machine if you use Ollama. Nothing is sent anywhere until you send a message.
- The bundled LangChain library may download token-counting data from `tiktoken.pages.dev` (a public CDN for the js-tiktoken library) when estimating message sizes for OpenAI models.
- The plugin makes no other network requests: there is no telemetry, no analytics, and no data is shared with the plugin author.

**Other capabilities used by the plugin:**

- **Vault access**: the agent's tools can list, read, create, and edit notes and folders in your vault. Edits can be reviewed before being applied with the "Review changes" setting.
- **Clipboard**: the copy buttons in the chat write the selected message or tool output to your system clipboard. The plugin never reads your clipboard.

## 🫱🏼‍🫲🏼 Contributing & Support

- Found a bug? Open an issue [here](https://github.com/TheManuelML/obsidian-agent/issues).  
- Want to contribute? Create a new pull request.
