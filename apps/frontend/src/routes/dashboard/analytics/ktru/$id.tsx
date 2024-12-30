import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export const Route = createFileRoute("/dashboard/analytics/ktru/$id")({
  component: KtruDetailsComponent,
});

function KtruDetailsComponent() {
  const { id } = Route.useParams();
  const { data: ktruDetails, isLoading } =
    trpc.analytics.getKtruDetails.useQuery({
      ktruCode: id,
    });
  const similaritySearch = trpc.analytics.searchSimilarKtruCodes.useMutation();
  const [similarItems, setSimilarItems] = React.useState<
    Array<{
      id: string;
      code: string;
      name: string | null;
      description: string | null;
      similarity: number;
    }>
  >([]);

  React.useEffect(() => {
    if (ktruDetails?.name) {
      similaritySearch
        .mutateAsync({ query: ktruDetails.name, limit: 5 })
        .then((results) => {
          setSimilarItems(results.filter((item) => item.id !== id));
        });
    }
  }, [ktruDetails?.name, id]);

  if (isLoading) {
    return <div className="container mx-auto p-4">Загрузка...</div>;
  }

  if (!ktruDetails) {
    return <div>КТРУ код не найден</div>;
  }

  return (
    <div className="container max-w-screen-2xl p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{ktruDetails.name}</h1>
        <p className="text-gray-600">{ktruDetails.code}</p>
        <p className="mt-2">{ktruDetails.description}</p>
      </div>

      {similarItems.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Похожие КТРУ коды</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarItems.map((item) => (
              <Card
                key={item.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  navigate({
                    to: "/dashboard/analytics/ktru/$id",
                    params: { id: item.id },
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="text-sm">{item.code}</CardTitle>
                  <CardDescription>
                    Схожесть: {(item.similarity * 100).toFixed(1)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm truncate">{item.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Всего контрактов</CardTitle>
            <CardDescription>За все время</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {ktruDetails.totalStats.contractCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Общая сумма</CardTitle>
            <CardDescription>За все время</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(ktruDetails.totalStats.totalSum)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Среднее местное содержание</CardTitle>
            <CardDescription>За все время</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {ktruDetails.totalStats.averageLocalShare.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Динамика контрактов</CardTitle>
            <CardDescription>Количество и сумма по месяцам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <LineChart data={ktruDetails.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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

        <Card>
          <CardHeader>
            <CardTitle>Местное содержание</CardTitle>
            <CardDescription>Средний процент по месяцам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <LineChart data={ktruDetails.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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

      {/* Yearly Statistics Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Годовая статистика</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Сумма контрактов по годам</CardTitle>
              <CardDescription>Общая сумма контрактов за год</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <BarChart data={ktruDetails.yearlyStats}>
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

          <Card>
            <CardHeader>
              <CardTitle>Местное содержание по годам</CardTitle>
              <CardDescription>
                Средний процент местного содержания за год
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <BarChart data={ktruDetails.yearlyStats}>
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
