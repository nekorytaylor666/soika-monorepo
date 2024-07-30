import { type UniqueIdentifier, useDndContext } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { cva } from "class-variance-authority";
import { DotSquare, GripVertical } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { EditColumnMenu } from "./EditColumnMenu";
import { type Task, TaskCard } from "./TaskCard";

export interface Column {
  id: UniqueIdentifier;
  title: string;
}

export type ColumnType = "Column";

export interface ColumnDragData {
  type: ColumnType;
  column: Column;
}

interface BoardColumnProps {
  column: Column;
  tasks: Task[];
  isOverlay?: boolean;
}

export function BoardColumn({ column, tasks, isOverlay }: BoardColumnProps) {
  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const {
    setNodeRef: setSortableNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDroppableNodeRef(node);
    setSortableNodeRef(node);
  };

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva(
    "h-[800px] max-h-[1000px] w-[400px] max-w-full  flex flex-col flex-shrink-0  snap-center border-0 bg-secondary/50",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 ring-primary opacity-30",
          overlay: "ring-2 ring-primary",
        },
      },
    },
  );

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="p-4 pl-6 font-semibold  text-left flex flex-row space-between items-center ">
        <div {...attributes} {...listeners} className="w-full cursor-grab">
          <span className=" text-base font-semibold ">{column.title}</span>
        </div>
        <EditColumnMenu column={column} />
      </CardHeader>
      <ScrollArea>
        <CardContent className="flex flex-grow flex-col gap-2 p-2 max-w-full">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

export function BoardContainer({ children }: { children: React.ReactNode }) {
  const dndContext = useDndContext();

  const variations = cva(
    "w-auto max-w-full md:px-0 flex lg:justify-start pb-4",
    {
      variants: {
        dragging: {
          default: "snap-x snap-mandatory",
          active: "snap-none",
        },
      },
    },
  );

  return (
    <ScrollArea
      className={variations({
        dragging: dndContext.active ? "active" : "default",
      })}
    >
      <div className="flex w-full gap-4 pt-4 px-4 items-start flex-row justify-start">
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
