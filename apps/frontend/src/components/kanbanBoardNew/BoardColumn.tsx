import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import React from "react";
import { type Task, TaskCard } from "./TaskCard";

interface Column {
  id: string;
  title: string;
}

interface BoardColumnProps {
  column: Column;
  tasks: Task[];
  index: number;
}

export function BoardColumn({ column, tasks, index }: BoardColumnProps) {
  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="h-[800px] max-h-[1000px] w-[400px] max-w-full flex flex-col flex-shrink-0 snap-center border-0 bg-secondary/50 mr-4"
        >
          <CardHeader
            className="p-4 pl-6 font-semibold text-left flex flex-row space-between items-center"
            {...provided.dragHandleProps}
          >
            <span className="text-base font-semibold">{column.title}</span>
            {/* <EditColumnMenu column={column} /> */}
          </CardHeader>
          <Droppable droppableId={column.id} type="TASK">
            {(provided, snapshot) => (
              <ScrollArea>
                <CardContent
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-grow flex-col gap-2 p-2 max-w-full ${
                    snapshot.isDraggingOver ? "bg-secondary/70" : ""
                  }`}
                >
                  {tasks.map((task, index) => (
                    <TaskCard key={task.id} task={task} index={index} />
                  ))}
                  {provided.placeholder}
                </CardContent>
              </ScrollArea>
            )}
          </Droppable>
        </Card>
      )}
    </Draggable>
  );
}
