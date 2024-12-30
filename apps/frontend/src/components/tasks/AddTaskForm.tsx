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
import { taskPriorityEnum } from "db/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { MinimalTiptapEditor } from "../minimal-tiptap/components/minimal-tiptap";

export const addTaskSchema = z.object({
  title: z.string().min(1, "Заголовок обязателен"),
  description: z.string().min(1, "Описание обязательно"),
  dueDate: z.date({
    required_error: "Срок выполнения обязателен",
    invalid_type_error: "Неверный формат даты",
  }),
  priority: z.enum(taskPriorityEnum.enumValues, {
    required_error: "Приоритет обязателен",
    invalid_type_error: "Неверный приоритет",
  }),
});

export type AddTaskFormData = z.infer<typeof addTaskSchema>;

export function AddTaskForm({
  isLoading,
  submitCallback,
}: {
  isLoading: boolean;
  submitCallback: (data: AddTaskFormData) => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "low",
      dueDate: undefined,
    },
  });
  const [date, setDate] = useState<Date>();

  const onSubmit = (data: AddTaskFormData) => {
    submitCallback(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-accent-700"
        >
          Заголовок
        </label>
        <Controller
          name="title"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Input
              {...field}
              id="title"
              placeholder="Введите заголовок задачи"
              className="w-full"
            />
          )}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-accent-700"
        >
          Описание
        </label>
        <Controller
          name="description"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <MinimalTiptapEditor
              {...field}
              value={field.value}
              onValueChange={field.onChange}
              contentClass="min-h-[200px]"
            />
          )}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex space-x-4">
        <div className="w-1/2 space-y-2">
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-accent-700"
          >
            Срок выполнения
          </label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, "PPP", { locale: ru })
                    ) : (
                      <span>Выберите дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setDate(date);
                    }}
                    locale={ru}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>

        <div className="w-1/2 space-y-2">
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-accent-700"
          >
            Приоритет
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите приоритет" />
                </SelectTrigger>
                <SelectContent>
                  {taskPriorityEnum.enumValues.map((priority, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <SelectItem key={index} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Добавление..." : "Добавить задачу"}
      </Button>
    </form>
  );
}
