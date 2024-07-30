import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumberWithCommas } from "@/lib/utils";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Draggable } from "@hello-pangea/dnd";
import { Link } from "@tanstack/react-router";
import type { BoardDeal } from "db/schema/schema";
import { cva } from "class-variance-authority";
import {
  Bot,
  ClockIcon,
  Currency,
  DollarSign,
  GripHorizontal,
  GripVertical,
  Package,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Large } from "../ui/typography";

export interface Task {
  id: UniqueIdentifier;
  dealId: string;
  columnId: ColumnId;
  content?: string;
  title?: string;
  budget?: number;
  deadline: Date;
}

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export type TaskType = "Task";

export interface TaskDragData {
  type: TaskType;
  task: Task;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva("w-full", {
    variants: {
      dragging: {
        over: "ring-2 ring-primary opacity-0",
        overlay: "ring-2 ring-primary",
      },
    },
  });

  return (
    <Draggable draggableId={task.id} index={0}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? "shadow-lg" : ""}`}
        >
          <Card
            ref={setNodeRef}
            style={style}
            className={variants({
              dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            })}
          >
            <CardHeader className="px-4 pt-4 pb-0 space-between flex flex-row  items-center justify-between relative ">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"link"}
                    className="px-0 text-accent-foreground w-64 text-left justify-start"
                  >
                    <Link
                      to="/dashboard/deals/$dealId"
                      params={{ dealId: task.dealId }}
                    >
                      <Large className="w-64 truncate">{task.title}</Large>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="start">
                  <p>{task.title}</p>
                </TooltipContent>
              </Tooltip>

              <Button
                size={"icon"}
                variant={"ghost"}
                className="w-6 h-6 cursor-grab"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-left whitespace-pre-wrap">
              <p className="text-sm font-mono text-muted-foreground h-12">
                {task.content}
              </p>
              <div className="flex gap-2 mt-6">
                <div className="bg-secondary p-3 rounded-md w-1/2 flex justify-between items-center">
                  <div className="w-full">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-primary uppercase">
                        Бюджет
                      </CardTitle>
                    </div>
                    <div>
                      <div className=" font-mono">
                        {formatNumberWithCommas(task.budget ?? 0)}
                        <span className="text-muted-foreground ml-1">₸</span>
                      </div>
                    </div>
                  </div>
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="bg-secondary p-3   rounded-md w-1/2 flex justify-between  items-center">
                  <div>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-primary uppercase">
                        Подобрано
                      </CardTitle>
                    </div>
                    <div>
                      <div className=" font-mono font">
                        4
                        <span className="text-sm text-muted-foreground ml-1">
                          Продукта
                        </span>
                      </div>
                    </div>
                  </div>
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-3 pb-4 flex flex-row items-center justify-center">
              <ClockIcon className="text-muted-foreground w-4 h-4 mr-2" />
              <p className="text-sm text-muted-foreground">Прием заявок до</p>
            </CardFooter>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
