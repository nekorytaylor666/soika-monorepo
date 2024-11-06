import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { H1, H3, H4, Large, P } from "@/components/ui/typography";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatNumberWithCommas } from "@/lib/utils";
import { Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalStorage } from "@/hooks/use-localstorage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Mock data
export const Route = createFileRoute("/dashboard/schedules/results/$resultId")({
  component: ResultPage,
  pendingComponent: LoadingResultPage,
});

function ResultPage() {
  const { resultId } = Route.useParams();
  const [limit] = useState(10);
  const navigation = useNavigate();

  const [storedRecommendations] = useLocalStorage<Recommendation[]>(
    "recommendations",
    []
  );
  const [result, setResult] = useState<Recommendation | null>(null);

  useEffect(() => {
    console.log(storedRecommendations);
    const foundResult = storedRecommendations.find(
      (r) => r.original_lot.id == resultId
    );
    console.log(foundResult);
    setResult(foundResult || null);
  }, [resultId, storedRecommendations]);

  return (
    <div className="w-full bg-background">
      <div className="flex h-16 items-center justify-start border-b px-4">
        <H4>Результат расчета</H4>
      </div>
      <div className="container max-w-2xl my-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <a
                href={`https://goszakup.gov.kz/ru/announce/index/${result?.original_lot.trdBuyId}`}
                target="_blank"
                rel="noreferrer"
              >
                <H3>{result?.original_lot.name}</H3>
              </a>
            </CardTitle>
            <CardDescription>
              {result?.original_lot.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <H4 className="mb-2">Детали оригинального лота</H4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <P>
                  <strong>Сумма:</strong>{" "}
                  {formatNumberWithCommas(result?.original_lot?.amount ?? 0)}{" "}
                  тенге
                </P>
                <P>
                  <strong>Способ закупки:</strong>{" "}
                  {result?.original_lot.tradeMethod}
                </P>
                <P>
                  <strong>Заказчик:</strong> {result?.original_lot.customerName}
                </P>
                <P>
                  <strong>Дата начала:</strong>{" "}
                  {new Date(
                    result?.original_lot?.trdBuyStartDate
                  ).toLocaleString("ru-RU")}
                </P>
                <P>
                  <strong>Дата окончания:</strong>{" "}
                  {new Date(result?.original_lot?.trdBuyEndDate).toLocaleString(
                    "ru-RU"
                  )}
                </P>
                <P>
                  <strong>Общая сумма закупки:</strong>{" "}
                  {formatNumberWithCommas(
                    result?.original_lot?.trdBuyTotalSum ?? 0
                  )}{" "}
                  тенге
                </P>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-4 container max-w-2xl">
          <H4 className="mb-4">Исполненные контракты</H4>
          {result?.similar_lots ? (
            result.similar_lots.map((result) => (
              <ResultDetails key={result.id} result={result} />
            ))
          ) : (
            <LoadingResultItems />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ResultDetails({ result }) {
  console.log("result:", result);
  return (
    <div className="flex flex-col gap-4 mb-8 border-b border-border pb-4">
      <div className="flex items-center justify-between gap-2">
        <a
          href={`https://goszakup.gov.kz/ru/egzcontract/cpublic/show/${result.contract_id}`}
          target="_blank"
          rel="noreferrer"
        >
          <Large className="text-primary">{result.text}</Large>
        </a>
        <P className="font-mono text-base whitespace-nowrap text-primary">
          {Number.parseFloat(result.score).toFixed(4)}
        </P>
      </div>
      <P className="font-mono text-muted-foreground text-sm">{result.text}</P>
    </div>
  );
}

function LoadingResultPage() {
  return (
    <div className="w-full bg-background">
      <div className="flex h-16 items-center justify-start border-b px-4">
        <H4>Результат расчета</H4>
      </div>
      <div className="p-4 container max-w-2xl">
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <LoadingResultItems />
        </ScrollArea>
      </div>
    </div>
  );
}

function LoadingResultItems() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-40" />
    </div>
  );
}
