import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Input, InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface Document {
  id: string;
  title: string;
}

interface DocumentMentionInputProps extends InputProps {
  onMention: (document: Document) => void;
  fetchDocuments: (query: string) => Promise<Document[]>;
}

const DocumentMentionInput = React.forwardRef<
  HTMLInputElement,
  DocumentMentionInputProps
>(({ className, onMention, fetchDocuments, ...props }, ref) => {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [mentionIndex, setMentionIndex] = useState<number | null>(null);
  const [mentionedDocs, setMentionedDocs] = useState<Document[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const lastAtIndex = value.lastIndexOf("@");

      if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
        setOpen(true);
        setMentionIndex(lastAtIndex);
        const docs = await fetchDocuments("");
        setDocuments(docs);
      } else if (open && lastAtIndex === mentionIndex) {
        const query = value.slice(mentionIndex + 1);
        const docs = await fetchDocuments(query);
        setDocuments(docs);
      } else {
        setOpen(false);
      }
    },
    [fetchDocuments, open, mentionIndex]
  );

  const handleMention = useCallback(
    (document: Document) => {
      if (inputRef.current && mentionIndex !== null) {
        const value = inputRef.current.value;
        const newValue = value.slice(0, mentionIndex);
        inputRef.current.value = newValue;
        setMentionedDocs((prev) => [...prev, document]);
        setOpen(false);
        onMention(document);
      }
    },
    [mentionIndex, onMention]
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [mentionedDocs]);

  const removeMention = useCallback((docId: string) => {
    setMentionedDocs((prev) => prev.filter((doc) => doc.id !== docId));
  }, []);

  // Add this useEffect hook
  useEffect(() => {
    if (!open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center border rounded-md p-1"
    >
      {mentionedDocs.map((doc) => (
        <Badge variant={"outline"} key={doc.id}>
          {doc.title}
          <Button
            variant="ghost"
            size="icon"
            className="ml-1 focus:outline-none py-0 px-0 h-4 w-4"
            onClick={() => removeMention(doc.id)}
          >
            <X className="w-2.5 h-2.5" />
          </Button>
        </Badge>
      ))}
      <Input
        {...props}
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          inputRef.current = node;
        }}
        className={cn("flex-grow border-none focus:ring-0 mt-1", className)}
        onChange={handleInputChange}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="w-4 h-4" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search documents..." className="h-9" />
            <CommandList>
              <CommandEmpty>No documents found.</CommandEmpty>
              <CommandGroup>
                {documents.map((doc) => (
                  <CommandItem
                    key={doc.id}
                    value={doc.id}
                    onSelect={() => handleMention(doc)}
                  >
                    {doc.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});

DocumentMentionInput.displayName = "DocumentMentionInput";

export { DocumentMentionInput };
