import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { H4, H3, P, Large } from "@/components/ui/typography";
import { trpc } from "@/lib/trpc";
import { formatNumberWithCommas } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/recommendations/$recommendedId/$lotId"
)({
  component: RecommendedLotPage,
});

function RecommendedLotPage() {
  const { recommendedId, lotId } = Route.useParams();

  const { data: result, isLoading } =
    trpc.recommendedLots.getLotByResultAndLotId.useQuery({
      recommendedId,
      lotId,
    });
  if (isLoading) {
    return <LoadingResultPage />;
  }

  return (
    <div className="w-full bg-background">
      <div className="flex h-16 items-center justify-start border-b px-4">
        <H4>Результат расчета</H4>
      </div>
      <div className="container max-w-2xl my-4">
        <Card className="border-none shadow-none p-0">
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
      <div className="p-4 container max-w-2xl">
        <H4 className="mb-4">Исполненные контракты похожие на этот</H4>
        {result?.similar_lots ? (
          result.similar_lots.map((result) => (
            <ResultDetails key={result.id} result={result} />
          ))
        ) : (
          <LoadingResultItems />
        )}
      </div>
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
