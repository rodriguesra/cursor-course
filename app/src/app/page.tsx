"use client";
import React from "react";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatDemoPage() {
  return (
    <div className="h-screen flex bg-white">
      <div className="flex-1 flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
}
