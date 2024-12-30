import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  DragDropContext,
  Draggable,
  type DropResult,
  Droppable,
} from "@hello-pangea/dnd";
import {
  DragHandleDots1Icon,
  DragHandleVerticalIcon,
} from "@radix-ui/react-icons";
import { getRouteApi } from "@tanstack/react-router";
import type { Deal } from "db/schema";
import { GripVertical } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { H2, H4 } from "../ui/typography";
import { AddColumnForm } from "./AddColumnForm";
import DealCard from "./DealCard";

interface Status {
  id: string;
  status: string;
  order: number;
}

interface Column {
  id: string;
  title: string;
  deals: Deal[];
  order: number;
}

const routeApi = getRouteApi("/dashboard/boards/$boardId");

const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);

  const { boardId } = routeApi.useParams();
  const { data: boardData, isLoading } = trpc.deal.getBoardData.useQuery({
    boardId,
  });
  const moveDealMutation = trpc.deal.moveDealToStatus.useMutation();
  const reorderColumnsMutation = trpc.board.updateColumnOrder.useMutation();

  useEffect(() => {
    if (boardData) {
      const newColumns = boardData.statuses.map((status) => ({
        id: status.id,
        title: status.status,
        deals: boardData.deals.filter((deal) => deal.status === status.id),
        order: status.order,
      }));
      setColumns(newColumns.sort((a, b) => a.order - b.order));
    }
  }, [boardData]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === "COLUMN") {
      const newColumns = Array.from(columns);
      const [reorderedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, reorderedColumn);

      const updatedColumns = newColumns.map((col, index) => ({
        ...col,
        order: index,
      }));

      setColumns(updatedColumns);

      await reorderColumnsMutation.mutateAsync({
        boardId,
        columnOrders: updatedColumns.map((col) => ({
          id: col.id,
          order: col.order,
        })),
      });
    } else {
      const { draggableId } = result;
      const sourceColumn = columns.find((col) => col.id === source.droppableId);
      const destColumn = columns.find(
        (col) => col.id === destination.droppableId
      );

      if (!sourceColumn || !destColumn) return;

      const sourceDeals = Array.from(sourceColumn.deals);
      const [movedDeal] = sourceDeals.splice(source.index, 1);

      let destDeals: Deal[];
      if (source.droppableId === destination.droppableId) {
        // Reordering within the same column
        destDeals = sourceDeals;
      } else {
        // Moving to a different column
        destDeals = Array.from(destColumn.deals);
      }
      destDeals.splice(destination.index, 0, movedDeal);

      const newColumns = columns.map((col) => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            deals:
              source.droppableId === destination.droppableId
                ? destDeals
                : sourceDeals,
          };
        }
        if (col.id === destination.droppableId) {
          return { ...col, deals: destDeals };
        }
        return col;
      });

      setColumns(newColumns);

      // Update the deal's status on the server
      await moveDealMutation.mutateAsync({
        dealId: draggableId,
        newStatus: destination.droppableId,
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex gap-2 px-8 overflow-x-auto  max-h-[calc(100vh-200px)] pb-20 py-4"
          >
            {columns.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      "w-72 flex-shrink-0 ",
                      snapshot.isDragging ? "opacity-50 " : "opacity-100"
                    )}
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="flex items-center justify-between mb-2 rounded-md hover:bg-primary hover:text-primary-foreground p-2 transition-colors "
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={"secondary"}>
                          {column.deals.length}
                        </Badge>
                        <h5 className="font-semibold font-mono text-base">
                          {column.title}
                        </h5>
                      </div>
                      <GripVertical className="size-5 " />
                    </div>

                    <Droppable droppableId={column.id} type="DEAL">
                      {(provided) => (
                        <div
                          className="min-h-[180px] flex flex-col gap-2 bg-secondary p-2 rounded-xl  h-min overflow-y-auto"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {column.deals.map((dealCard, index) => (
                            <Draggable
                              key={dealCard.id}
                              draggableId={dealCard.deal.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                >
                                  <DealCard
                                    deal={dealCard.deal}
                                    isDragging={snapshot.isDragging}
                                    dragHandleProps={provided.dragHandleProps}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            <div className="pt-12">
              <AddColumnForm />
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default KanbanBoard;
