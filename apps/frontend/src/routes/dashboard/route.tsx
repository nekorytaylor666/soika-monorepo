import MainContent from "@/components/MainContent";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpcClient } from "@/hooks/useTrpc";
import { authClient } from "@/lib/auth";
import { trpc } from "@/lib/trpc";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import {
  BellRing,
  ChevronDown,
  Hash,
  Inbox,
  Kanban,
  ListChecks,
  Plus,
  SquareKanban,
  UserCircle,
  BarChart2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Session from "supertokens-web-js/recipe/session";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  beforeLoad: async () => {
    const { data, error } = await authClient.getSession();
    console.log(data);
    if (!data) {
      throw redirect({ to: "/login" });
    }
  },
  // pendingComponent: PendingComponent,
});

export function Dashboard() {
  const [boards] = trpc.board.getAllByUser.useSuspenseQuery();
  const [user] = trpc.user.getUser.useSuspenseQuery();
  console.log(user);
  return (
    <div className="flex min-h-screen max-w-screen w-full bg-muted/40">
      <div className="bg-background border-r z-50   h-full fixed w-[60px] hover:w-[256px] group transition-all duration-200 ease-in-out overflow-hidden px-3">
        <div className="flex flex-col justify-between items-start h-full pb-12">
          <div className="flex flex-col gap-2 w-full">
            <Link className="w-36" to="/dashboard">
              <div className="flex gap-2 items-center relative hover:text-primary w-36">
                <svg
                  className="size-9 my-4 fill-accent-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  version="1.0"
                  viewBox="0 0 282 274"
                >
                  <path
                    fill="currentColor"
                    d="M82.3 48.7c-6.2 13.8-6.8 17.2-6.8 36.3.1 16.4.3 17.9 2.8 24.9 4.6 12.6 12 24.3 21.1 33 4.1 4.1 4.9 4.4 7.3 3.5 2.2-.7 2.9-1.7 3.1-4.2.3-2.8-.5-4.2-4.8-8.9-14.6-16-20.9-32.6-19.7-52.3.5-8.7 2.6-19.2 4-20.6.3-.4 2.4.9 4.5 2.7 4.5 3.8 34.3 30.5 50.2 44.9 5.8 5.2 12.5 11.2 14.9 13.4 4.1 3.6 4.2 3.9 2.5 5-3.2 1.9-86.5 45.4-97.9 51.1-6 3-6 3-6.3 7.8-.3 4.6-.3 4.7 2.7 4.7 1.7 0 7.5-2.3 13.3-5.4 39.1-20.3 78.4-40.8 101.2-52.6 17-8.8 18.1-9.2 22.9-8.7 4.2.4 5.6 1 8.4 4 3.8 4.2 5 7.9 3.7 11.6-.9 2.4-1.4 2.6-7.9 2.9l-7 .3-3.4 6.6c-7.3 14-16.7 23.9-25.6 26.9-8.7 3-19.1.1-30.6-8.6-2.8-2.1-5.6-3.6-6.3-3.4-.6.3-2.9 3-5.1 6.2-14 19.8-14.2 20.2-6.2 20.1 5.2 0 5.2 0 9.5-5.9l4.3-5.9 8 4.2c8 4.2 8.2 4.2 18.7 4.2 9.3 0 11.4-.3 15.7-2.4 8.6-4.2 16.7-12.9 25.9-27.9l2.6-4.2h14.9l1.7-5.7c1.1-3.8 1.5-7.8 1.2-12.4-.4-5.7-1.1-7.6-3.9-11.6-6.7-9.4-19.1-12.8-29.8-8.2-4.4 1.8-4.9 2.4-5.7 6.4l-.9 4.5-16.6-14.8c-9.1-8.1-28.6-25.5-43.4-38.7C86.8 42.2 86.6 42.1 85.9 42c-.3 0-2 3-3.6 6.7z"
                  />
                </svg>
                <span className="opacity-0 text-accent-foreground left-8 absolute font-bold group-hover:inline group-hover:ml-2 group-hover:opacity-100 transition-all duration-200  ease-in-out">
                  Soika AI
                </span>
              </div>
            </Link>
            <Button
              className="w-[36px] group-hover:w-full px-1.5 justify-start font-mono text-muted-foreground"
              variant="ghost"
              asChild
            >
              <Link
                to="/dashboard/lots"
                activeProps={{
                  className: "bg-accent text-primary",
                }}
              >
                <div className="flex gap-2 items-center relative">
                  <Inbox className="size-6 " />
                  <span className="opacity-0 left-6 absolute  group-hover:inline group-hover:ml-2 group-hover:opacity-100 transition-all duration-200 ease-in-out">
                    Лоты
                  </span>
                </div>
              </Link>
            </Button>
            <Button
              className="w-[36px] group-hover:w-full px-1.5 justify-start font-mono text-muted-foreground"
              variant="ghost"
              asChild
            >
              <Link
                to="/dashboard/schedules"
                activeProps={{
                  className: "bg-accent text-primary",
                }}
              >
                <div className="flex gap-2 items-center relative">
                  <BellRing className="size-6 " />
                  <span className="opacity-0 left-6 absolute  group-hover:inline group-hover:ml-2 group-hover:opacity-100 transition-all duration-200 ease-in-out">
                    Расписание
                  </span>
                </div>
              </Link>
            </Button>
            <Button
              className="w-[36px] group-hover:w-full px-1.5 justify-start font-mono text-muted-foreground"
              variant="ghost"
              asChild
            >
              <Link
                to="/dashboard/tasks"
                activeProps={{
                  className: "bg-accent text-primary",
                }}
              >
                <div className="flex gap-2 items-center relative">
                  <ListChecks className="size-6 " />
                  <span className="opacity-0 left-6 absolute  group-hover:inline group-hover:ml-2 group-hover:opacity-100 transition-all duration-200 ease-in-out">
                    Задачи
                  </span>
                </div>
              </Link>
            </Button>
            <Button
              className="w-[36px] group-hover:w-full px-1.5 justify-start font-mono text-muted-foreground"
              variant="ghost"
              asChild
            >
              <Link
                to="/dashboard/analytics"
                activeProps={{
                  className: "bg-accent text-primary",
                }}
              >
                <div className="flex gap-2 items-center relative">
                  <BarChart2 className="size-6 " />
                  <span className="opacity-0 left-6 absolute  group-hover:inline group-hover:ml-2 group-hover:opacity-100 transition-all duration-200 ease-in-out">
                    Аналитика
                  </span>
                </div>
              </Link>
            </Button>
            <div className="w-full ">
              <div className="flex gap-1 w-full">
                <Button
                  className="w-[36px] group-hover:w-full px-1.5 justify-start font-mono text-muted-foreground"
                  variant="ghost"
                  asChild
                >
                  <Link to="/dashboard/boards">
                    <div className="flex gap-2 items-center relative">
                      <Kanban className="size-6 " />
                      <span className="opacity-0 left-6 absolute  group-hover:flex group-hover:ml-2 group-hover:opacity-100 transition-all duration-200 ease-in-out">
                        Доски
                      </span>
                    </div>
                  </Link>
                </Button>
                <div className="inline gap-2 items-center">
                  <AddBoardPopover />
                </div>
              </div>
              <ScrollArea className="h-96">
                <div className="opacity-0 ml-4 mt-2 flex flex-col gap-2 group-hover:opacity-100 transition-all duration-200 ease-in">
                  {boards.map((board) => (
                    <Button
                      key={board.id}
                      className="w-[36px] group-hover:w-full px-1.5 justify-start font-mono text-muted-foreground"
                      variant="ghost"
                      asChild
                    >
                      <Link
                        to="/dashboard/boards/$boardId"
                        params={{ boardId: board.id }}
                        activeProps={{
                          className: "bg-accent text-primary",
                        }}
                      >
                        <div className="flex gap-2 items-center relative">
                          <Hash className="size-6 " />
                          <span className="opacity-0 left-6 absolute  group-hover:inline group-hover:ml-2 group-hover:opacity-100 transition-all duration-200 ease-in-out">
                            {board.name}
                          </span>
                        </div>
                      </Link>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <Button
            className="w-[36px] group-hover:w-full px-1.5 justify-start font-mono text-muted-foreground"
            variant="ghost"
            asChild
          >
            <Link
              to="/dashboard/profile"
              activeProps={{
                className: "bg-accent text-primary",
              }}
            >
              <div className="flex gap-2 items-center relative">
                <UserCircle className="size-6 " />
                <span className="opacity-0 left-6 absolute  group-hover:inline group-hover:ml-2 group-hover:opacity-100 transition-all duration-200 ease-in-out">
                  {user?.name}
                </span>
              </div>
            </Link>
          </Button>
        </div>
      </div>

      <div className="ml-[60px] w-[calc(100vw-60px)] min-h-screen bg-background">
        <Outlet />
      </div>
    </div>
  );
}

export function PendingComponent() {
  return (
    <div className="grid grid-cols-[56px_auto_80%]  min-h-screen max-w-screen w-full bg-muted/40">
      <Sidebar />

      <div className="bg-background border-r  w-full flex flex-col px-4">
        <div className="flex items-center h-16">
          <img src="/logo.svg" alt="logo" className="w-10 h-10" />
        </div>
        <Button
          className="w-full justify-start px-2 font-mono text-muted-foreground"
          variant="ghost"
          asChild
        >
          <Link
            to="/dashboard/lots"
            activeProps={{
              className: "bg-accent text-white",
            }}
          >
            <SquareKanban className="mr-2" />
            Лоты
          </Link>
        </Button>
        <Button
          className="w-full justify-start px-2 font-mono text-muted-foreground"
          variant="ghost"
        >
          <Inbox className="mr-2" />
          Лента
        </Button>
        <div className="flex justify-between items-center mt-4">
          <h4 className="text-base font-medium tracking-tight ">Доски</h4>
          <Button size={"icon"} variant="ghost">
            <Plus className="w-4 h-4 " />
          </Button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

export function AddBoardPopover() {
  const { register, handleSubmit } = useForm<{ name: string }>();
  const createBoard = trpc.board.create.useMutation();
  const utils = trpc.useUtils();
  const onSubmit = async (data: { name: string }) => {
    console.log(data);
    await createBoard.mutateAsync(data);
    utils.board.getAllByUser.invalidate();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size={"icon"} variant="ghost">
          <Plus className="w-4 h-4 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Добавить Доску</h4>
              <p className="text-sm text-muted-foreground">
                Добавить новую доску для ваших сделок.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="name">Название доски</Label>
                <Input
                  id="name"
                  {...register("name")}
                  className="col-span-2 h-8"
                />
              </div>
            </div>
            <Button variant="default" type="submit">
              {createBoard.isLoading ? "Добавляю..." : "Добавить"}
            </Button>
            <Button type="button" variant={"secondary"}>
              <PopoverClose aria-label="Close">Отмена</PopoverClose>
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
