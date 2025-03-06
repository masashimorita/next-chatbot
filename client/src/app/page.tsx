"use client";
import { useChat } from "@ai-sdk/react";

export default function Home() {
  const {
    input,
    messages,
    handleInputChange,
    handleSubmit,
  } = useChat();

  return (
    <div>
      {messages.map((message, index) => (
        <div key={index}>
          <p>{message.content}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input 
          type="text"
          placeholder="Search"
          value={input}
          onChange={handleInputChange}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
};
