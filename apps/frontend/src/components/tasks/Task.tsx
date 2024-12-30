import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { DealTask } from "db/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import React from "react";

interface TaskProps {
  task: DealTask;
}

export function Task({ task }: TaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-background p-3 rounded-md mb-2 shadow-sm cursor-move"
    >
      <h4 className="font-medium mb-1">{task.name}</h4>
      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
      <div className="flex justify-between items-center">
        <Badge variant="outline">{getStatusLabel(task.status)}</Badge>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={task.createdBy || ""}
              alt={task.createdBy || ""}
            />
            <AvatarFallback>{task.createdBy?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {format(task?.dueDate || new Date(), "dd MMM yyyy", { locale: ru })}
          </span>
        </div>
      </div>
    </div>
  );
}
