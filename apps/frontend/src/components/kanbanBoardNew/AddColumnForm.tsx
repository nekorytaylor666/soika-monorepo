import { trpc } from "@/lib/trpc";
import { getRouteApi, useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
const routeApi = getRouteApi("/dashboard/boards/$boardId");

export function AddColumnForm() {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit } = useForm<{ columnName: string }>();
  const { boardId } = routeApi.useParams();
  const { mutate, isLoading } = trpc.board.createBoardColumn.useMutation();
  const utils = trpc.useUtils();
  const onSubmit = (data: { columnName: string }) => {
    mutate(
      { boardId: boardId, columnName: data.columnName },
      {
        onSuccess: () => {
          utils.deal.getBoardData.invalidate({ boardId: boardId });
          toast.success("Колонка добавлена");
          setOpen(false);
        },
      },
    );
  };

  return (
    <div className="h-full flex flex-col justify-start w-96">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            className="py-6 gap-1 rounded-xl"
            variant={"outline"}
            type="button"
          >
            Добавить колонку
            <Plus className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 mt-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Создание колонки</h4>
              <p className="text-sm text-muted-foreground">
                Создайте новую колонку для вашей доски.
              </p>
            </div>
            <div className="grid  items-center gap-4">
              <Label htmlFor="column-name">Название колонки</Label>
              <Input
                {...register("columnName")}
                id="column-name"
                placeholder="Название колонки"
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Добавление..." : "Добавить"}
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
