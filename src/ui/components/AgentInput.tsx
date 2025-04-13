import React from "react";


// AgentInput component
// This component is used to render the input field to interact with the agent
export const AgentInput = () => {
  const [message, setMessage] = React.useState("");

  const handleSend = () => {
    // Add your message sending logic here
    // Here we will send a request to the API sending the message to the Agent
    console.log("Sending message:", message);
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here" className="agent-input"/>
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
