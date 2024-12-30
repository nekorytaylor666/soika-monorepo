import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, BotMessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import type { Lot } from "db/schema";
import { DocumentMentionInput } from "../documentMention";

const ChatbotSidebar: React.FC<{ lot: Lot }> = ({ lot }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "http://localhost:3000/api/chat",
      body: {
        lotId: lot.id,
      },
      onError: () =>
        toast.error("Произошла ошибка. Пожалуйста, попробуйте позже."),
    });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        className="fixed right-4 top-4 z-40"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-all duration-300 ease-in-out",
          "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-md",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="absolute right-4 top-4">
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="icon">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-foreground">ИИ помощник</h2>
          <p className="text-sm text-muted-foreground">
            Обсудите с нашим ИИ помощником все детали вашего лота.
          </p>
        </div>

        <ScrollArea className="mt-4 h-[calc(100%-9rem)] w-full pb-4 pr-4">
          <div className="flex flex-col space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="flex flex-row gap-2">
                <div className="w-6 h-6 flex-shrink-0">
                  {m.role === "assistant" ? (
                    <BotMessageSquare className="text-primary" />
                  ) : (
                    <User className="text-primary" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <Markdown>{m.content}</Markdown>
                </div>
              </div>
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex flex-row gap-2">
                  <div className="w-6 h-6 flex-shrink-0">
                    <BotMessageSquare className="text-primary" />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <Skeleton className="w-1/2 h-4 animate-pulse" />
                    <Skeleton className="w-2/3 h-4 animate-pulse" />
                  </div>
                </div>
              )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              autoFocus
              type="text"
              placeholder="Введите ваше сообщение..."
              value={input}
              onChange={handleInputChange}
            />
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatbotSidebar;
