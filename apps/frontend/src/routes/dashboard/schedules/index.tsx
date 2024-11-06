import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MoreHorizontal,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
import { H3, H4 } from "@/components/ui/typography";
import { useForm } from "react-hook-form";
import {
  type Schedule,
  scheduleFrequencyEnum,
  scheduleFrequencyEnumSchema,
} from "db/schema/schema";
import { getFrequencyLabel } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const scheduleSchema = z.object({
  query: z.string(),
  frequency: scheduleFrequencyEnumSchema,
});

function SchedulesPage() {
  const [user] = trpc.user.getUser.useSuspenseQuery();
  const organizationId = user?.organizations[0].organizationId;
  const form = useForm({
    resolver: zodResolver(scheduleSchema),
  });

  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const editScheduleForm = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      query: editingSchedule?.query || "",
      frequency: editingSchedule?.frequency || "daily",
    },
  });
  const { mutate: createSchedule, isLoading } =
    trpc.schedule.create.useMutation();
  const { data: schedules } = trpc.schedule.getAll.useQuery({
    organizationId: organizationId || "",
  });
  const { mutate: editSchedule } = trpc.schedule.edit.useMutation();
  const { mutate: deleteSchedule } = trpc.schedule.delete.useMutation();
  const utils = trpc.useUtils();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const triggerEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    editScheduleForm.setValue("query", schedule.query);
    editScheduleForm.setValue("frequency", schedule.frequency);
  };

  const columns: ColumnDef<Schedule>[] = [
    { accessorKey: "query", header: "Запрос" },
    {
      accessorKey: "frequency",
      header: "Интервал",
      cell: ({ row }) => {
        if (row.original.frequency) {
          return getFrequencyLabel(row.original.frequency);
        }
        return "Не указан";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Открыть меню</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleRunSearch(row.original)}>
              <PlayIcon className="h-4 w-4 mr-2" /> Запустить
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => triggerEdit(row.original)}>
              <PencilIcon className="h-4 w-4 mr-2" /> Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2Icon className="h-4 w-4 mr-2" /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: schedules || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCreateSchedule = (data: z.infer<typeof scheduleSchema>) => {
    createSchedule(
      { ...data, organizationId },
      {
        onSuccess: () => {
          setIsOpen(false);
          toast.success("Расписание создано");
          utils.schedule.getAll.invalidate({ organizationId });
        },
      }
    );
  };

  const handleEditSchedule = (data: z.infer<typeof scheduleSchema>) => {
    console.log(data);
    if (editingSchedule) {
      editSchedule(
        { ...data, id: editingSchedule.id },
        {
          onSuccess: () => {
            setEditingSchedule(null);
            toast.success("Расписание изменено");
            utils.schedule.getAll.invalidate({ organizationId });
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteSchedule(
      { id },
      {
        onSuccess: () => {
          toast.success("Расписание удалено");
          utils.schedule.getAll.invalidate({ organizationId });
        },
      }
    );
  };
  const handleRunSearch = (schedule: Schedule) => {
    console.log(`Запуск поиска для запроса: ${schedule.query}`);
    navigate({
      to: "/dashboard/lots",
      search: {
        search: schedule.query,
        withRecommendations: false,
        page: 1,
      },
    });
    // Implement actual search functionality here
  };

  return (
    <div className="">
      <div className="h-16 border-b px-4 flex justify-center items-center relative">
        <Button
          onClick={() => history.back()}
          variant="ghost"
          size={"icon"}
          className="p-2 absolute left-4"
        >
          <ArrowLeft className="w-full" />
        </Button>

        <H4>Автоматические поиски</H4>
      </div>
      <div className="p-8 container max-w-screen-md">
        <H3 className="text-lg font-bold mb-4">Расписания</H3>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="mb-4">Создать расписание</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новое расписание</DialogTitle>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(handleCreateSchedule, (error) => {
                console.log(error);
              })}
            >
              <Input placeholder="Введите запрос" {...form.register("query")} />
              <Select
                value={form.watch("frequency")}
                onValueChange={(value) => form.setValue("frequency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите интервал" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Ежедневно</SelectItem>
                  <SelectItem value="weekly">Еженедельно</SelectItem>
                  <SelectItem value="monthly">Ежемесячно</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Создание..." : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editingSchedule}
          onOpenChange={() => setEditingSchedule(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать расписание</DialogTitle>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={editScheduleForm.handleSubmit(
                handleEditSchedule,
                (error) => {
                  console.log(error);
                }
              )}
            >
              <Input
                placeholder="Введите запрос"
                {...editScheduleForm.register("query")}
              />
              <Select
                value={editScheduleForm.watch("frequency")}
                onValueChange={(value) =>
                  editScheduleForm.setValue("frequency", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите интервал" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleFrequencyEnum.enumValues.map((frequency) => (
                    <SelectItem value={frequency} key={frequency}>
                      {getFrequencyLabel(frequency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit">Сохранить</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/schedules/")({
  component: SchedulesPage,
});
