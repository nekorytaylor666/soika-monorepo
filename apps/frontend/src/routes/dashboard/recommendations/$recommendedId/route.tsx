import { trpc } from "@/lib/trpc";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { H4 } from "@/components/ui/typography";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumberWithCommas } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute(
  "/dashboard/recommendations/$recommendedId"
)({
  component: RecommendationListPage,
});

function RecommendationListPage() {
  const { recommendedId } = Route.useParams();
  const [data] =
    trpc.recommendedLots.getListById.useSuspenseQuery(recommendedId);

  const columns: ColumnDef<(typeof data)[0]>[] = [
    {
      accessorKey: "original_lot.name",
      header: "Название лота",
      cell: ({ row }) => (
        <Button
          asChild
          variant="link"
          className="p-0 h-auto font-normal  w-48 text-wrap text-left justify-start text-primary"
        >
          <Link
            to="/dashboard/recommendations/$recommendedId/$lotId"
            params={{
              recommendedId: recommendedId,
              lotId: row.original.original_lot.id,
            }}
          >
            {row.original.original_lot.name}
          </Link>
        </Button>
      ),
    },
    {
      accessorKey: "original_lot.description",
      header: "Описание",
    },
    {
      accessorKey: "original_lot.amount",
      header: "Цена",
      cell: ({ row }) => (
        <div className="w-48  font-mono ">
          {formatNumberWithCommas(row.original.original_lot.amount)} KZT
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.results,
    columns,

    getCoreRowModel: getCoreRowModel(),
  });

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

        <H4>Рекомендации</H4>
      </div>
      <div className="grid grid-cols-2">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>
              Рекомендации для{" "}
              {data?.createdAt &&
                format(new Date(data?.createdAt), "dd MMMM", { locale: ru })}
            </CardTitle>
            <CardDescription>
              {data?.results.length} рекомендаций
            </CardDescription>
          </CardHeader>
          <CardContent className="font-mono">
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="border-l border-border">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <Outlet />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
