import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "../../../components/ui/input";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Search } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface KtruData {
  id: string;
  code: string;
  nameRu: string | null;
  descriptionRu: string | null;
  totalContractSum: number;
  contractCount: number;
  averageLocalShare: number;
}

interface SimilaritySearchResult {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  similarity: number;
}

interface SelectedKtruCodes {
  [key: string]: boolean;
}

export const Route = createFileRoute("/dashboard/analytics/")({
  component: AnalyticsComponent,
});

function AnalyticsComponent() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const navigate = Route.useNavigate();
  const { data: ktruAnalytics, isLoading } =
    trpc.analytics.getTopKtruByContractSum.useQuery();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedKtruCodes, setSelectedKtruCodes] = useState<SelectedKtruCodes>(
    {}
  );
  const [filteredKtruIds, setFilteredKtruIds] = useState<string[]>([]);

  const similaritySearch = trpc.analytics.searchSimilarKtruCodes.useMutation({
    onSuccess: (data) => {
      const newSelected = data.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {} as SelectedKtruCodes);
      setSelectedKtruCodes(newSelected);
      setFilteredKtruIds(data.map((item) => item.id));
    },
  });

  const groupAnalytics = trpc.analytics.getSimilarKtruGroupAnalytics.useQuery(
    {
      query: searchQuery,
      ktruIds: Object.entries(selectedKtruCodes)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id),
    },
    {
      enabled:
        isSearching && searchQuery.length > 0 && filteredKtruIds.length > 0,
    }
  );

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    await similaritySearch.mutateAsync({ query: searchQuery, limit: 50 });
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelected = { ...selectedKtruCodes };
    filteredKtruIds.forEach((id) => {
      newSelected[id] = checked;
    });
    setSelectedKtruCodes(newSelected);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedKtruCodes((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const columns: ColumnDef<KtruData>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Код КТРУ
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "nameRu",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Наименование
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "totalContractSum",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Общая сумма контрактов
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return formatCurrency(row.getValue("totalContractSum"));
      },
    },
    {
      accessorKey: "contractCount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Количество контрактов
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "averageLocalShare",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Средняя доля местного содержания
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return `${row.getValue<number>("averageLocalShare").toFixed(2)}%`;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ktru = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(ktru.code)}
              >
                Копировать код КТРУ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigate({
                    to: "/dashboard/analytics/ktru/$id",
                    params: { id: ktru.id },
                  });
                }}
              >
                Просмотр деталей
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: ktruAnalytics ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-4">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Топ КТРУ кодов с низкой долей местного содержания
      </h1>

      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Поиск похожих КТРУ кодов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xl"
            />
          </div>
          <Button onClick={handleSearch} disabled={!searchQuery || isSearching}>
            <Search className="h-4 w-4 mr-2" />
            Поиск
          </Button>
        </div>

        {similaritySearch.data && similaritySearch.data.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Похожие КТРУ коды</CardTitle>
              <CardDescription>
                Найдено {similaritySearch.data.length} похожих кодов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredKtruIds.length > 0 &&
                            filteredKtruIds.every((id) => selectedKtruCodes[id])
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Код</TableHead>
                      <TableHead>Наименование</TableHead>
                      <TableHead>Схожесть</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {similaritySearch.data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedKtruCodes[item.id] || false}
                            onCheckedChange={(checked) =>
                              handleSelectOne(item.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          {(item.similarity * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigate({
                                to: "/dashboard/analytics/ktru/$id",
                                params: { id: item.id },
                              });
                            }}
                          >
                            Детали
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {groupAnalytics.data && !groupAnalytics.error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Выбрано КТРУ кодов</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {Object.values(selectedKtruCodes).filter(Boolean).length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Общая сумма контрактов</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(groupAnalytics.data.totalStats.totalSum)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Среднее местное содержание</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {groupAnalytics.data.totalStats.averageLocalShare.toFixed(
                      2
                    )}
                    %
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Динамика контрактов группы</CardTitle>
                  <CardDescription>
                    Количество и сумма по месяцам
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <LineChart data={groupAnalytics.data.monthlyStats}>
                      {/* ... existing chart configuration ... */}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Местное содержание группы</CardTitle>
                  <CardDescription>Средний процент по месяцам</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <LineChart data={groupAnalytics.data.monthlyStats}>
                      {/* ... existing chart configuration ... */}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {groupAnalytics.error && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-red-500">Ошибка</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Не удалось загрузить аналитику по группе. Пожалуйста, попробуйте
                позже.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Поиск по коду КТРУ..."
          value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("code")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Нет результатов.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Вперед
        </Button>
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(amount);
}
