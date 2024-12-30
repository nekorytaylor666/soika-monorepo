import React, { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import type { Lot } from "db/schema";
import { toast } from "sonner";
import { Markdown } from "@/components/ui/markdown";
import { BotMessageSquare, User } from "lucide-react";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { DocumentMentionInput } from "../documentMention";

const ChatContainer = ({ lot }: { lot: Lot }) => {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "http://localhost:3000/generate",
      onError: () => toast.error("An error occurred. Please try again later."),
    });

  const [files, setFiles] = useState<FileList | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ... handlePaste, handleDrop, and other file-related functions ...

  return (
    <div className="flex flex-col justify-between py-8 w-full h-full px-8  mx-auto stretch">
      <div className="flex flex-col gap-4  overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-row gap-2 px-4">
            <div className="w-6 h-6 flex-shrink-0">
              {m.role === "assistant" ? (
                <BotMessageSquare className="text-zinc-500" />
              ) : (
                <User className="text-zinc-500" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Markdown>{m.content}</Markdown>
              {/* Render attachments here */}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex flex-row gap-2 px-4">
            <div className="w-6 h-6 flex-shrink-0">
              <BotMessageSquare className="text-zinc-500" />
            </div>
            <div className="flex flex-col w-full gap-1">
              <Skeleton className="w-1/2 h-4 animate-pulse" />
              <Skeleton className="w-2/3 h-4 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          const options = files ? { experimental_attachments: files } : {};
          handleSubmit(e, options);
          setFiles(null);
        }}
      >
        <Input
          className=" w-full "
          value={input}
          placeholder="Скажите что-нибудь..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
};

export default ChatContainer;
