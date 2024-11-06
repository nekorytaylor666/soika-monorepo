import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { DealTask, taskPriorityEnum } from "db/schema/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { MinimalTiptapEditor } from "../minimal-tiptap/components/minimal-tiptap";

export function EditTaskForm({
  isLoading,
  submitCallback,
  initialData,
}: {
  isLoading: boolean;
  submitCallback: (data: DealTask) => void;
  initialData: DealTask;
}) {
  console.log(initialData);
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DealTask>({
    defaultValues: initialData,
    resolver: zodResolver(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        dueDate: z.date().optional(),
        priority: z.enum(taskPriorityEnum.enumValues),
      })
    ),
  });

  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  const onSubmit = (data: DealTask) => {
    submitCallback(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        type="text"
        placeholder="Заголовок"
        {...register("name")}
        className="input input-bordered w-full"
      />

      <div className="flex items-center gap-2">
        <Popover arrow={false} label="Выберите дату">
          <PopoverTrigger>
            <Button
              type="button"
              aria-label="Открыть календарь"
              className="flex h-9 w-9 items-center justify-center"
            >
              <CalendarIcon className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="popover-content ">
            <Controller
              {...register("dueDate")}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(date) => field.onChange(date)}
                  className="calendar"
                />
              )}
            />
          </PopoverContent>
        </Popover>
        <span className="text-sm">
          {watch("dueDate")
            ? format(watch("dueDate"), "d MMMM yyyy", { locale: ru })
            : "Не указана"}
        </span>
      </div>

      <Select
        {...register("priority")}
        className="select select-bordered w-full"
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="select-content">
          {taskPriorityEnum.enumValues.map((priority) => (
            <SelectItem value={priority} key={priority}>
              {priority}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Сохранение..." : "Сохранить изменения"}
      </Button>
    </form>
  );
}
