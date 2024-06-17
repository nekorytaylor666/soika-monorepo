import { createFileRoute } from "@tanstack/react-router";
import { H4 } from "@/components/ui/typography";
import { KanbanBoard } from "@/components/KanbanBoard";
import { AddTenderDialog } from "@/components/addTenderDialog";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/feed/$boardId")({
  component: MainContent,
  pendingComponent: SkeletonFeedDashboard,
  loader: async () => {
    const statuses = [
      { id: 1, status: "Входящие" },
      { id: 2, status: "Первичная проверка" },
    ];
    const deals = [
      {
        id: "tender1",
        lot: 1,
        board: 1,
        status: 1,
        createdAt: "2023-12-01",
        createdBy: "user1",
        name: "Поставка мебели",
        budget: 500000,
      },
    ];
    return {
      deals,
      statuses,
    };
  },
});

function MainContent() {
  const { statuses, deals } = Route.useLoaderData();
  const { boardId } = Route.useParams();
  const [board] = trpc.board.getById.useSuspenseQuery(boardId);

  console.log("board:", board);
  return (
    <div className="w-full bg-background">
      <div className="flex h-16 items-center border-b bg-background px-4">
        <H4>Ваши сделки</H4>
      </div>
      <div>
        <KanbanBoard statuses={board.statuses} deals={board.deals} />
      </div>
    </div>
  );
}

function SkeletonFeedDashboard() {
  return (
    <div className="w-full bg-background ">
      <div className="flex h-16 items-center border-b bg-background px-4">
        <H4>Ваши сделки</H4>
      </div>
      <div className="p-4">
        <Skeleton className="h-12 px-4 py-2 w-[200px] rounded-md mb-4" />
        <div className=" flex gap-4">
          <Skeleton className="w-[400px] h-[800px] rounded-md" />
          <Skeleton className="w-[400px] h-[800px] rounded-md" />

          <Skeleton className="w-[400px] h-[800px] rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default MainContent;
