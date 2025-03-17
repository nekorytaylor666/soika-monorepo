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
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/analytics/ktru-groups/")({
  component: TopKtruGroupsBySum,
});

function TopKtruGroupsBySum() {
  const { data: topGroups, isLoading } =
    trpc.analytics.getTopKtruGroupsBySum.useQuery();
  const [expandedGroups, setExpandedGroups] = React.useState<
    Record<string, boolean>
  >({});

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "KZT",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    window.open("/ktru_groups.csv", "_blank");
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Анализ КТРУ групп</h1>
          <Button onClick={handleDownloadCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Скачать CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Иерархия КТРУ групп по сумме контрактов</CardTitle>
            <CardDescription>
              Группы КТРУ и их подгруппы, отсортированные по сумме контрактов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Код</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead className="text-right">
                    Количество контрактов
                  </TableHead>
                  <TableHead className="text-right">Сумма контрактов</TableHead>
                  <TableHead className="text-right">
                    Среднее местное содержание
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topGroups?.map((group) => (
                  <React.Fragment key={group.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                        >
                          {expandedGroups[group.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {group.code}
                      </TableCell>
                      <TableCell>{group.nameRu || "—"}</TableCell>
                      <TableCell className="text-right">
                        {group.contractCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(group.totalSum)}
                      </TableCell>
                      <TableCell className="text-right">
                        {group.averageLocalShare.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    {expandedGroups[group.id] &&
                      group.subgroups.map((subgroup) => (
                        <TableRow key={subgroup.id} className="bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell className="font-medium pl-8">
                            {subgroup.code}
                          </TableCell>
                          <TableCell>{subgroup.nameRu || "—"}</TableCell>
                          <TableCell className="text-right">
                            {subgroup.contractCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(subgroup.totalSum)}
                          </TableCell>
                          <TableCell className="text-right">
                            {subgroup.averageLocalShare.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
