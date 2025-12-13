# Gemini API Runners

## Agent Runner
How `agentRunner.ts` works

Previuosly we used to work with langchain and langgraph for the agent workflow.
Now with the google gemini API we need to do a lot of the turn-conversation process manually.

Pipeline:
1. Create a chatHistory with messages from the Obsidian chat file.
2. Send the agent the user message.
3. Get the agent response: reasoning, response, toolCalls.
4. Get the toolCall parameters.
5. Execute the toolCall using the name and arguments.
6. Update the chatHistory with the toolCall and send a new message with the functionResponse.
7. Get the final answer of the agent, if it call another toolCall repeat from step 4.

## Model Runner
The function `callModel` in `modelRunner.ts` simply calls a gemini llm model.
NO streaming, NO tools, NO memory. Simple requests

## Function Runner
Imports the available function declarations from `src/backend/tools` and uses a switch to execute them using the model Function Call.
