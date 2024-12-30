import { getPriorityLabel, getStatusLabel } from "@/lib/utils";

import { type ColumnDef, sortingFns } from "@tanstack/react-table";
import type { DealTask, TaskPriority, TaskStatus } from "db/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Link } from "@tanstack/react-router";

const priorityOrder = { low: 0, medium: 1, high: 2 };
const statusOrder = { not_started: 0, in_progress: 1, completed: 2 };

export const columns: ColumnDef<DealTask>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Название
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link to={`/dashboard/tasks/${row.original.id}`}>
        <Button variant="link" className="lowercase pl-4 hover:underline">
          {row.getValue("name")}
        </Button>
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Статус
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as TaskStatus;
      return (
        <Badge
          className="ml-4"
          variant={
            status === "completed"
              ? "success"
              : status === "in_progress"
                ? "warning"
                : "secondary"
          }
        >
          {getStatusLabel(status)}
        </Badge>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
      const statusA =
        statusOrder[rowA.getValue(columnId) as keyof typeof statusOrder];
      const statusB =
        statusOrder[rowB.getValue(columnId) as keyof typeof statusOrder];
      return statusA - statusB;
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Приоритет
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const priority = row.getValue("priority") as TaskPriority;
      return (
        <Badge
          className="ml-4"
          variant={
            priority === "high"
              ? "destructive"
              : priority === "medium"
                ? "warning"
                : "secondary"
          }
        >
          {getPriorityLabel(priority)}
        </Badge>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
      const priorityA =
        priorityOrder[rowA.getValue(columnId) as keyof typeof priorityOrder];
      const priorityB =
        priorityOrder[rowB.getValue(columnId) as keyof typeof priorityOrder];
      return priorityA - priorityB;
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Дедлайн
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string;
      return (
        <div className="pl-4">
          {format(new Date(dueDate), "dd MMM yyyy", { locale: ru })}
        </div>
      );
    },
    sortingFn: sortingFns.datetime,
  },
  {
    id: "actions",
    header: "Действия",
    enableHiding: false,
    cell: ({ row }) => {
      const task = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(task.id)}
            >
              Copy task ID
            </DropdownMenuItem>
            <DropdownMenuItem>View task details</DropdownMenuItem>
            <DropdownMenuItem>Edit task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
