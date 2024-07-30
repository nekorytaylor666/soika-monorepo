import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H4 } from "@/components/ui/typography";
import { trpc } from "@/lib/trpc";
import { getStatusColor, getStatusLabel, getStatusVariant } from "@/lib/utils";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { TaskStatus } from "db/schema/schema";
import { format } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/dashboard/tasks/")({
  component: TasksPage,
});

type TaskStatusWithAll = "all" | TaskStatus;

function TasksPage() {
  const [status, setStatus] = useState<TaskStatusWithAll>("all");
  const { data: allTasks, isLoading } =
    trpc.deal.getTasksAssignedToMe.useQuery();

  const statusButtons: { label: string; value: TaskStatusWithAll }[] = [
    { label: "Все", value: "all" },
    { label: getStatusLabel("not_started"), value: "not_started" },
    { label: getStatusLabel("in_progress"), value: "in_progress" },
    { label: getStatusLabel("completed"), value: "completed" },
  ];

  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    if (status === "all") return allTasks;
    return allTasks.filter((task) => task.status === status);
  }, [allTasks, status]);

  return (
    <div className="bg-background w-full">
      <div className="h-16 border-b px-4 flex justify-center items-center relative">
        <Button
          onClick={() => history.back()}
          variant="ghost"
          size={"icon"}
          className="p-2 absolute left-4"
        >
          <ArrowLeft className="w-full" />
        </Button>

        <H4>Задачи</H4>
      </div>
      <div className="container lg:max-w-screen-sm mt-4">
        <div className="p-6 space-y-6">
          <div className="flex space-x-2">
            {statusButtons.map((button) => (
              <Button
                key={button.value}
                variant={status === button.value ? "default" : "outline"}
                onClick={() => setStatus(button.value)}
              >
                {button.label}
              </Button>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {filteredTasks?.length ?? 0} Задачи
            </h2>
          </div>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {filteredTasks?.map((task) => (
                <Card key={task.id} className="p-4">
                  <Link to={`/dashboard/tasks/${task.id}`}>
                    <h3 className="font-semibold hover:underline">
                      {task.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500">
                    Срок выполнения: {format(task.dueDate, "MM/dd/yyyy")}
                  </p>
                  <div className="mt-2">
                    <Badge variant={getStatusVariant(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
