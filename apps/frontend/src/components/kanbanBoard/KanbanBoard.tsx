import { trpc } from "@/lib/trpc";
import { DragDropContext, type DropResult, Droppable } from "@hello-pangea/dnd";
import { getRouteApi } from "@tanstack/react-router";
import type { BoardDeal, Status } from "db/schema/schema";
import React, { useEffect, useState } from "react";
import { AddColumnForm } from "../kanbanBoardNew/AddColumnForm";
import { BoardColumn } from "./BoardColumn";
import type { Task } from "./TaskCard";

interface KanbanBoardProps {
  statuses: Status[];
  deals: BoardDeal[];
}

const routeApi = getRouteApi("/dashboard/boards/$boardId");

export function KanbanBoard({ statuses, deals }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { boardId } = routeApi.useParams();

  const updateColumnOrderMutation = trpc.board.updateColumnOrder.useMutation();
  const updateTaskOrderMutation = trpc.deal.moveDealToStatus.useMutation();

  useEffect(() => {
    setColumns(statuses);
    const tasks = deals.map(({ id, deal, status }) => ({
      id,
      dealId: deal.id,
      columnId: status.id,
      title: deal.lot.lotName,
      content: deal.lot.lotDescription,
      budget: deal.lot.budget,
      deadline: new Date(),
      lot: deal.lot.id,
    }));
    setTasks(tasks);
  }, [statuses, deals]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "COLUMN") {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      setColumns(newColumns);

      updateColumnOrderMutation.mutate({
        boardId: boardId,
        columnOrders: newColumns.map((col, index) => ({
          id: col.id,
          order: index,
        })),
      });
      return;
    }

    const start = columns.find((col) => col.id === source.droppableId);
    const finish = columns.find((col) => col.id === destination.droppableId);

    if (!start || !finish) return;

    if (start === finish) {
      const newTasks = Array.from(tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      setTasks(newTasks);
      return;
    }

    // Moving from one list to another
    const newTasks = Array.from(tasks);
    const [removed] = newTasks.splice(source.index, 1);
    removed.columnId = finish.id;
    newTasks.splice(destination.index, 0, removed);

    setTasks(newTasks);

    updateTaskOrderMutation.mutate({
      dealId: removed.id,
      newStatus: finish.id,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex overflow-x-auto p-4 h-min"
          >
            {columns.map((column, index) => (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={tasks.filter((task) => task.columnId === column.id)}
                index={index}
              />
            ))}
            {provided.placeholder}
            <AddColumnForm />
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
