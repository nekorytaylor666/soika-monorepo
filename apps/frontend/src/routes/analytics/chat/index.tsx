import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart as NewBarChart } from "@/components/ui/bar-chart";

export const Route = createFileRoute("/analytics/chat/")({
  component: ChatComponent,
});

const selectedKtruSchema = z.object({
  selectedKtrus: z.array(
    z.object({
      id: z.string(),
      name: z.string().nullable(),
      description: z.string().nullable(),
      code: z.string(),
    })
  ),
});

type SelectedKtruData = z.infer<typeof selectedKtruSchema>;

const chartConfig = {
  contractCount: {
    label: "Количество контрактов",
    color: "hsl(var(--chart-1))",
  },
  totalSum: {
    label: "Сумма контрактов",
    color: "hsl(var(--chart-2))",
  },
  averageLocalShare: {
    label: "Местное содержание",
    color: "hsl(var(--chart-3))",
  },
} as const;

function ChatComponent() {
  const [query, setQuery] = React.useState("");
  const [shouldGenerateReport, setShouldGenerateReport] = React.useState(false);
  const [searchResults, setSearchResults] =
    React.useState<SelectedKtruData | null>(null);

  const searchMutation = useMutation<SelectedKtruData, Error, string>({
    mutationFn: async (searchQuery: string) => {
      const response = await fetch("http://localhost:3000/api/chat/agent", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: searchQuery,
      });

      if (!response.ok) {
        throw new Error("Ошибка поиска");
      }

      const data = await response.json();
      return selectedKtruSchema.parse(data);
    },
    onError: (error) => {
      toast.error("Не удалось найти коды КТРУ");
    },
    onSuccess: (data) => {
      setSearchResults(data);
    },
  });

  const exactSearchMutation = trpc.analytics.searchExactKtruCode.useMutation({
    onError: (error) => {
      toast.error("Не удалось найти код КТРУ");
    },
    onSuccess: (response) => {
      // Handle both direct array response and nested response format
      const data = Array.isArray(response)
        ? response
        : response?.result?.data?.json || [];

      if (data.length === 0) {
        toast.error("Код КТРУ не найден");
        return;
      }

      // Transform the data to match the expected format
      const transformedData: SelectedKtruData = {
        selectedKtrus: data.map((ktru) => ({
          id: ktru.id,
          name: ktru.name || ktru.nameRu,
          description: ktru.description || ktru.descriptionRu,
          code: ktru.code,
        })),
      };

      setSearchResults(transformedData);
    },
  });

  const reportMutation =
    trpc.analytics.getSimilarKtruGroupAnalytics.useMutation({
      onError: (error) => {
        toast.error("Не удалось сгенерировать отчет");
      },
      onSuccess: () => {
        setShouldGenerateReport(true);
      },
    });

  const handleSearch = React.useCallback(() => {
    if (!query.trim()) return;

    // Reset previous search results
    setSearchResults(null);

    // Check if the query is a KTRU code (supports both XX.XX.XX.XXX-XXXX and XXXXXX.XXX.XXXXXX formats)
    const ktruCodeRegex =
      /^(\d{2}\.\d{2}\.\d{2}\.\d{3}-\d{4}|\d{6}\.\d{3}\.\d{6})$/;
    const numericQuery = query.trim().replace(/\s+/g, "");

    // Also check if it's just a sequence of 6 or more digits that might be a KTRU code
    const isNumericKtru = /^\d{6,}$/.test(numericQuery);

    if (ktruCodeRegex.test(numericQuery) || isNumericKtru) {
      exactSearchMutation.mutate({ code: numericQuery });
    } else {
      searchMutation.mutate(query);
    }
  }, [query, searchMutation, exactSearchMutation]);

  const handleGenerateReport = React.useCallback(() => {
    if (!searchResults?.selectedKtrus.length) return;
    const ktruIds = searchResults.selectedKtrus.map((ktru) => ktru.id);
    reportMutation.mutate({
      query,
      ktruIds,
    });
  }, [query, searchResults, reportMutation]);

  const isLoading = searchMutation.isLoading || exactSearchMutation.isLoading;

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare className="h-5 w-5" />
            Поиск кодов КТРУ
          </CardTitle>
          <CardDescription>
            Введите ваш запрос для поиска соответствующих кодов КТРУ. ИИ
            проанализирует ваш запрос и найдет наиболее подходящие коды.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Введите поисковый запрос..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Поиск
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Описание</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-96" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && searchResults?.selectedKtrus.length === 0 && (
        <Card className="mb-8">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p>По вашему запросу ничего не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить условия поиска</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && searchResults?.selectedKtrus.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Найденные коды КТРУ</CardTitle>
            <CardDescription>
              Найдено кодов: {searchResults.selectedKtrus.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Описание</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.selectedKtrus.map((ktru) => (
                    <TableRow key={ktru.id}>
                      <TableCell>{ktru.code}</TableCell>
                      <TableCell>{ktru.name || "—"}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {ktru.description || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleGenerateReport}
                disabled={reportMutation.isLoading}
              >
                {reportMutation.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Генерация отчета...
                  </>
                ) : (
                  "Сгенерировать отчет"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reportMutation.isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-8 w-full">
            <Card className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[500px] w-full" />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {shouldGenerateReport && reportMutation.data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Выбрано КТРУ кодов</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {reportMutation.data.totalStats.ktruCodesCount}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Общая сумма контрактов</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(reportMutation.data.totalStats.totalSum)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Среднее местное содержание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {reportMutation.data.totalStats.averageLocalShare.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Динамика контрактов группы</CardTitle>
                <CardDescription>Количество и сумма по месяцам</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportMutation.data.monthlyStats.map((stat) => ({
                        month: new Intl.DateTimeFormat("ru", {
                          month: "short",
                          year: "2-digit",
                        }).format(new Date(stat.month)),
                        "Количество контрактов": stat.contractCount,
                        "Сумма контрактов (тг)": stat.totalSum,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "currentColor", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        tick={{ fill: "currentColor", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.toString()}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: "currentColor", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="font-medium">
                                  {payload[0].payload.month}
                                </div>
                                {payload.map((p, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="size-2 rounded-full"
                                        style={{ backgroundColor: p.color }}
                                      />
                                      <span className="text-muted-foreground">
                                        {p.name}:
                                      </span>
                                    </div>
                                    <span className="font-medium">
                                      {p.name === "Сумма контрактов (тг)"
                                        ? formatCurrency(p.value)
                                        : p.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        formatter={(value) => (
                          <span className="text-sm text-muted-foreground">
                            {value}
                          </span>
                        )}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="Количество контрактов"
                        name="Количество контрактов"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="Сумма контрактов (тг)"
                        name="Сумма контрактов"
                        fill="hsl(var(--secondary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Местное содержание группы</CardTitle>
                <CardDescription>Средний процент по месяцам</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[500px] w-full"
                >
                  <LineChart data={reportMutation.data.monthlyStats}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      className="text-sm"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return new Intl.DateTimeFormat("ru", {
                          month: "short",
                          year: "2-digit",
                        }).format(date);
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      className="text-sm"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="averageLocalShare"
                      stroke={chartConfig.averageLocalShare.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Сумма контрактов по годам</CardTitle>
                <CardDescription>Общая сумма контрактов за год</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[500px] w-full"
                >
                  <BarChart data={reportMutation.data.yearlyStats}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      className="text-sm"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-sm"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const value = payload[0].value as number;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="font-medium">Год:</div>
                              <div>{payload[0].payload.year}</div>
                              <div className="font-medium">Сумма:</div>
                              <div>{formatCurrency(value)}</div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="totalSum"
                      fill={chartConfig.totalSum.color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Местное содержание по годам</CardTitle>
                <CardDescription>
                  Средний процент местного содержания за год
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[500px] w-full"
                >
                  <BarChart data={reportMutation.data.yearlyStats}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      className="text-sm"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      className="text-sm"
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const value = payload[0].value as number;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="font-medium">Год:</div>
                              <div>{payload[0].payload.year}</div>
                              <div className="font-medium">
                                Местное содержание:
                              </div>
                              <div>{value.toFixed(2)}%</div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="averageLocalShare"
                      fill={chartConfig.averageLocalShare.color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 w-full">
            <h2 className="text-xl font-bold mb-4">
              Распределение по КТРУ кодам
            </h2>

            <div className="mb-8 w-full">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Топ КТРУ по количеству контрактов</CardTitle>
                  <CardDescription>
                    Распределение контрактов по кодам КТРУ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="h-[800px] w-full"
                  >
                    <BarChart
                      data={reportMutation.data.ktruStats
                        .sort((a, b) => b.contractCount - a.contractCount)
                        .map((item) => ({
                          ...item,
                          label: `${item.code}\n${item.name || ""}`,
                        }))}
                      layout="vertical"
                      margin={{ left: 400, right: 40, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="label"
                        type="category"
                        width={280}
                        tick={({ x, y, payload }) => (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={-3}
                              y={0}
                              dy={0}
                              textAnchor="end"
                              fill="#666"
                            >
                              <tspan x={-3} dy="0.355em">
                                {payload.value.split("\n")[0]}
                              </tspan>
                              <tspan
                                x={-3}
                                dy="1.2em"
                                fontSize="0.8em"
                                fill="#666"
                              >
                                {payload.value.split("\n")[1]}
                              </tspan>
                            </text>
                          </g>
                        )}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="font-medium">{data.code}</div>
                                <div>{data.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {data.description}
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div className="font-medium">Контракты:</div>
                                  <div>{data.contractCount}</div>
                                  <div className="font-medium">Сумма:</div>
                                  <div>{formatCurrency(data.totalSum)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="contractCount"
                        fill={chartConfig.contractCount.color}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8 w-full">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Топ КТРУ по сумме контрактов</CardTitle>
                  <CardDescription>
                    Распределение сумм контрактов по кодам КТРУ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="h-[800px] w-full"
                  >
                    <BarChart
                      data={reportMutation.data.ktruStats
                        .sort((a, b) => b.totalSum - a.totalSum)
                        .map((item) => ({
                          ...item,
                          label: `${item.code}\n${item.name || ""}`,
                        }))}
                      layout="vertical"
                      margin={{ left: 400, right: 40, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <YAxis
                        dataKey="label"
                        type="category"
                        width={280}
                        tick={({ x, y, payload }) => (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={-3}
                              y={0}
                              dy={0}
                              textAnchor="end"
                              fill="#666"
                            >
                              <tspan x={-3} dy="0.355em">
                                {payload.value.split("\n")[0]}
                              </tspan>
                              <tspan
                                x={-3}
                                dy="1.2em"
                                fontSize="0.8em"
                                fill="#666"
                              >
                                {payload.value.split("\n")[1]}
                              </tspan>
                            </text>
                          </g>
                        )}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="font-medium">{data.code}</div>
                                <div>{data.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {data.description}
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div className="font-medium">Контракты:</div>
                                  <div>{data.contractCount}</div>
                                  <div className="font-medium">Сумма:</div>
                                  <div>{formatCurrency(data.totalSum)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="totalSum"
                        fill={chartConfig.totalSum.color}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
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
