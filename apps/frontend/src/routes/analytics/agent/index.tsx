import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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

interface KtruAnalytics {
  totalStats: {
    ktruCodesCount: number;
    contractCount: number;
    totalSum: number;
    averageLocalShare: number;
  };
  monthlyStats: Array<{
    month: string;
    contractCount: number;
    totalSum: number;
    averageLocalShare: number;
  }>;
  yearlyStats: Array<{
    year: string;
    contractCount: number;
    totalSum: number;
    averageLocalShare: number;
  }>;
  ktruStats: Array<{
    id: string;
    code: string;
    name: string | null;
    description: string | null;
    contractCount: number;
    totalSum: number;
    averageLocalShare: number;
  }>;
}

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

export const Route = createFileRoute("/analytics/agent/")({
  component: AgentAnalyticsComponent,
});

function AgentAnalyticsComponent() {
  const navigate = Route.useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedKtruCodes, setSelectedKtruCodes] =
    React.useState<SelectedKtruCodes>({});
  const [filteredKtruIds, setFilteredKtruIds] = React.useState<string[]>([]);
  const [shouldGenerateReport, setShouldGenerateReport] = React.useState(false);
  const [analyticsData, setAnalyticsData] =
    React.useState<KtruAnalytics | null>(null);

  const similaritySearch = trpc.analytics.searchSimilarKtruCodes.useMutation({
    onSuccess: (data) => {
      const newSelected = data.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {} as SelectedKtruCodes);
      setSelectedKtruCodes(newSelected);
      setFilteredKtruIds(data.map((item) => item.id));
      setAnalyticsData(null);
      setShouldGenerateReport(false);
    },
  });

  const groupAnalytics =
    trpc.analytics.getSimilarKtruGroupAnalytics.useMutation({
      onSuccess: (data) => {
        setAnalyticsData(data);
      },
    });

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    await similaritySearch.mutateAsync({ query: searchQuery, limit: 50 });
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelected = { ...selectedKtruCodes };
    for (const id of filteredKtruIds) {
      newSelected[id] = checked;
    }
    setSelectedKtruCodes(newSelected);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedKtruCodes((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleGenerateReport = async () => {
    const selectedIds = Object.entries(selectedKtruCodes)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) return;

    setShouldGenerateReport(true);
    try {
      await groupAnalytics.mutateAsync({
        query: searchQuery,
        ktruIds: selectedIds,
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  };

  return (
    <div className="w-full p-4">
      <div className="max-w-[1920px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">Поиск похожих КТРУ кодов</h1>

        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Введите описание товара или услуги..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-3xl"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery || similaritySearch.isLoading}
            >
              <Search className="h-4 w-4 mr-2" />
              Поиск
            </Button>
          </div>

          {similaritySearch.data && similaritySearch.data.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Найденные КТРУ коды</CardTitle>
                <CardDescription>
                  Выберите коды для анализа группы (
                  {similaritySearch.data.length} найдено)
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
                              filteredKtruIds.every(
                                (id) => selectedKtruCodes[id]
                              )
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
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={
                      !Object.values(selectedKtruCodes).some(Boolean) ||
                      groupAnalytics.isLoading
                    }
                  >
                    {groupAnalytics.isLoading ? (
                      <>
                        <span className="mr-2">Генерация отчета...</span>
                      </>
                    ) : (
                      <>Сгенерировать отчет</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {shouldGenerateReport && analyticsData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full">
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
                      {formatCurrency(analyticsData.totalStats.totalSum)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Среднее местное содержание</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {analyticsData.totalStats.averageLocalShare.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mb-8 w-full">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Динамика контрактов группы</CardTitle>
                    <CardDescription>
                      Количество и сумма по месяцам
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="h-[500px] w-full"
                    >
                      <LineChart data={analyticsData.monthlyStats}>
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
                          yAxisId="left"
                          tickLine={false}
                          axisLine={false}
                          className="text-sm"
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                          className="text-sm"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="contractCount"
                          stroke={chartConfig.contractCount.color}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="totalSum"
                          stroke={chartConfig.totalSum.color}
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
                    <CardTitle>Местное содержание группы</CardTitle>
                    <CardDescription>
                      Средний процент по месяцам
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="h-[500px] w-full"
                    >
                      <LineChart data={analyticsData.monthlyStats}>
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
                    <CardDescription>
                      Общая сумма контрактов за год
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="h-[500px] w-full"
                    >
                      <BarChart data={analyticsData.yearlyStats}>
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
                      <BarChart data={analyticsData.yearlyStats}>
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
                          data={analyticsData.ktruStats
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
                                    <div className="font-medium">
                                      {data.code}
                                    </div>
                                    <div>{data.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {data.description}
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      <div className="font-medium">
                                        Контракты:
                                      </div>
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
                          data={analyticsData.ktruStats
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
                                    <div className="font-medium">
                                      {data.code}
                                    </div>
                                    <div>{data.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {data.description}
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      <div className="font-medium">
                                        Контракты:
                                      </div>
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

          {shouldGenerateReport && groupAnalytics.error && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-red-500">Ошибка</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Не удалось загрузить аналитику по группе. Пожалуйста,
                  попробуйте позже.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
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
