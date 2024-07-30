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
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { AddBoardPopover } from "../route";

export const Route = createFileRoute("/dashboard/boards/")({
  component: BoardList,
});

function BoardList() {
  const [boards] = trpc.board.getAllByUser.useSuspenseQuery();

  return (
    <div className="w-full bg-background">
      <div className="flex h-16 items-center border-b bg-background px-4">
        <H4>Ваши сделки</H4>
      </div>
      <div className="container max-w-screen-md pt-8 ">
        <div className="flex justify-between items-center">
          <div>
            <H1>Ваши сделки</H1>
            <p className="text-sm text-gray-500">
              Все ваши сделки будут отображаться здесь
            </p>
          </div>
          <AddBoardPopover />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 mt-8">
          {boards.map((board) => (
            <Card className="border border-border" key={board.id}>
              <Link
                key={board.id}
                to="/dashboard/boards/$boardId"
                params={{ boardId: board.id }}
              >
                <CardHeader className="pb-2 hover:underline hover:text-primary">
                  <CardTitle className="text-primary text-xl ">
                    {board.name}
                  </CardTitle>
                </CardHeader>
              </Link>
              <CardContent className="flex justify-between items-center">
                <p className="text-lg text-muted-foreground rounded-lg font-mono">
                  {board.deals.length} сделок
                </p>
                <Button size="icon" variant="ghost">
                  <DotsHorizontalIcon />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
