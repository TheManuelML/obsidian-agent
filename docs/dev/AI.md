# AI Documentation

## Table of Contents
1. [Adding a New LLM Provider](#adding-a-new-llm-provider)
2. [Message Flow](#message-flow)
3. [Agent Architecture](#agent-architecture)
4. [Prompt Management](#prompt-management)
5. [Tools](#tools)

## Adding a New LLM Provider

### Required Files
1. `src/settings/models.ts`
   - Define the new model in `allAvailableModels`
   - Add the provider to `ModelProvider` enum
   - Configure model-specific settings

2. `src/backend/managers/modelManager.ts`
   - Add the provider to `ChatModelTypeMap`
   - Configure provider-specific settings in `getModelConfig`
   - Handle provider-specific API requirements

## Message Flow

### 1. User Input
- `src/components/chat/Input.tsx`
  - Handles user message input
  - Manages file and note attachments
  - Triggers `handleSend` hook

### 2. Message Processing
- `src/components/chat/Chat.tsx`
  - Receives message from Input component
  - Initializes streaming service
  - Manages conversation state

### 3. Streaming Service
- `src/components/chat/services/chatStreamingService.ts`
  - Exports messages to chat history
  - Manages streaming state
  - Updates UI with response chunks

### 4. Agent Execution
- `src/backend/managers/agentRunner.ts`
  - Processes message and attachments
  - Manages streaming response
  - Handles multimodal inputs (text + images)

## Agent Architecture

### Core Components
1. `src/backend/managers/agentManager.ts`
   - Creates and configures the agent
   - Manages agent lifecycle
   - Integrates with model, memory and tools

2. `src/backend/managers/modelManager.ts`
   - Handles model initialization
   - Manages API keys and configuration
   - Provides model interface to agent

### Tools Integration
The agent has access to the following tools:
- `createNote`: Create new notes
- `readNote`: Read note contents
- `editNote`: Modify existing notes
- `createDir`: Create directories
- `listFiles`: List directory contents
- `search`: Search through vault
- `rename`: Rename files/directories

## Prompt Management

### Components
1. `src/backend/managers/agentRunner.ts`
   - Calls appropriate prompt template
   - Handles different input types (text/multimodal)

2. `src/backend/managers/prompts/library.ts`
   - Central repository for all prompts

3. `src/backend/managers/prompts/promptManager.ts`
   - Formats prompts for agent use

### Prompt Types
- Simple prompts: Text-only interactions, notes and files are transformed to plain text
- Multimodal prompts: Text and image processing

## Tools
### Core files
1. `src/bancked/tools`
    - This folder holds all the tools
    - Tools are divided in:
        - File related
        - Directory related
        - Search related
        - Renaming related
2. `src/backend/managers/agentManager.ts`
    - Attach the tools to the agent with createAgent()