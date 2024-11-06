import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { H1, H4 } from "@/components/ui/typography";
import { trpc } from "@/lib/trpc";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel, getStatusVariant } from "@/lib/utils";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

export const Route = createFileRoute("/dashboard/tasks/$taskId")({
  component: TaskId,
});

export default function TaskId() {
  const { taskId } = Route.useParams();
  const [task] = trpc.deal.getTaskById.useSuspenseQuery(taskId);
  if (!task) {
    return <div>Task not found</div>;
  }
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
        <Card>
          <CardHeader>
            <CardTitle>
              <H1>{task.name}</H1>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Badge variant={getStatusVariant(task.status)}>
                  {getStatusLabel(task.status)}
                </Badge>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <H4>Описание</H4>
                <div
                  className="prose p-4 border rounded-lg"
                  dangerouslySetInnerHTML={{ __html: task?.description || "" }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant={"ghost"} size="icon">
              <ChatBubbleIcon />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
