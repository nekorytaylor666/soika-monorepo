import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getStatusLabel } from "@/lib/utils";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import type { DealTask, TaskStatus } from "db/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Link } from "@tanstack/react-router";

const statusColumns: TaskStatus[] = ["not_started", "in_progress", "completed"];

interface KanbanBoardProps {
  initialTasks: DealTask[];
  dealId: string;
}

export function KanbanBoard({ initialTasks, dealId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<DealTask[]>(initialTasks);
  const utils = trpc.useUtils();

  const { mutate: updateTaskStatus } = trpc.deal.updateTaskStatus.useMutation({
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await utils.deal.getById.cancel(dealId);

      // Snapshot the previous value
      const previousTasks = tasks;

      // Optimistically update to the new value
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === newTask.taskId
            ? { ...task, status: newTask.status }
            : task
        )
      );

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context) {
        setTasks(context.previousTasks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      utils.deal.getById.invalidate(dealId);
      utils.deal.getTasksAssignedToMe.invalidate();
    },
  });

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;

    // Optimistically update the UI
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === draggableId ? { ...task, status: newStatus } : task
      )
    );

    // Call the mutation
    updateTaskStatus({ status: newStatus, taskId: draggableId });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex space-x-4 overflow-x-auto p-4">
        {statusColumns.map((status) => (
          <div key={status}>
            <h3 className="font-semibold mb-2 flex gap-2 items-center">
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {tasks.filter((t) => t.status === status).length}
              </span>
              <span>{getStatusLabel(status)}</span>
            </h3>
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-muted min-h-[146px] p-1 pb-0 flex flex-col rounded-xl min-w-[350px] "
                >
                  {tasks
                    .filter((task) => task.status === status)
                    .map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            className="mb-1"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <CardHeader>
                              <Link to={`/dashboard/tasks/${task.id}`}>
                                <CardTitle className="hover:underline text-primary">
                                  {task.name}
                                </CardTitle>
                              </Link>
                            </CardHeader>
                            <CardContent>
                              <div
                                className="text-accent-foreground font-mono text-ellipsis overflow-hidden w-full"
                                dangerouslySetInnerHTML={{
                                  __html: task.description || "",
                                }}
                              />
                              <div className="flex justify-between items-center mt-4">
                                <Badge
                                  variant="outline"
                                  className="flex items-center"
                                >
                                  <CalendarIcon className="mr-1 h-3 w-3" />
                                  {isOverdue(task.dueDate)
                                    ? "Просрочена"
                                    : "Срок выполнения"}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

function isOverdue(dueDate: Date | string): boolean {
  return new Date(dueDate) < new Date();
}
