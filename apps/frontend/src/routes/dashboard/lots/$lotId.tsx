import TenderMainInfo from "@/components/TenderMainInfo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { H4 } from "@/components/ui/typography";
import { formatNumberWithCommas } from "@/lib/utils";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import { TenderProductTable } from "@/components/TenderProductTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import type { Lot, RecommendedProduct } from "db/schema";
import ChatbotSidebar from "@/components/lotPage/chatbotSidebar";

export const Route = createFileRoute("/dashboard/lots/$lotId")({
  parseParams: (params) => ({
    lotId: z.number().parse(Number(params.lotId)),
  }),
  pendingComponent: TenderSkeleton,

  component: () => <TenderPage />,
});

function TenderPage() {
  const { lotId } = Route.useParams();
  const [lot] = trpc.lot.getById.useSuspenseQuery(lotId);

  const { history } = useRouter();
  return (
    <div className="bg-background w-full relative">
      <div className="h-16 border-b px-4 flex justify-center items-center relative">
        <Button
          onClick={() => history.back()}
          variant="ghost"
          size={"icon"}
          className="p-2 absolute left-4"
        >
          <ArrowLeft className="w-full" />
        </Button>

        <H4>Детали объявления</H4>
      </div>
      <div className="container lg:max-w-3xl mt-4">
        <div>
          <TenderMainInfo
            tenderName={lot?.lotName ?? ""}
            tenderStatus="Опубликовано (прием ценовых предложений)"
            totalCost={`KZT ${formatNumberWithCommas(lot?.budget ?? 0)}`}
            deadline={lot?.deliveryTerm ?? ""}
            tenderNumber={lot?.lotNumber ?? ""}
          />
        </div>
        <Tabs defaultValue="details" className="w-full mt-4">
          <TabsList className="mb-2">
            <TabsTrigger value="details">Детали объявления</TabsTrigger>
            <TabsTrigger value="candidates">Предложения от ИИ</TabsTrigger>
          </TabsList>
          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <CardTitle>Варианты продуктов</CardTitle>
                <CardDescription>
                  Варианты продуктов, которые подходят под технические
                  спецификации
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TenderProductTable
                  recommendedProducts={lot?.recommendedProducts ?? []}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="details">
            {lot && <TenderDetails data={lot} />}
          </TabsContent>
        </Tabs>
      </div>
      {lot && <ChatbotSidebar lot={lot} />}
    </div>
  );
}

function TenderDetails({
  data,
}: {
  data: Lot & { recommendedProducts: RecommendedProduct[] };
}) {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Детали объявления</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="w-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Наименование лота
                </CardTitle>
              </div>
              <div>
                <div className=" font-mono  ">{data.lotName}</div>
              </div>
            </div>
            <div className="w-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Описание
                </CardTitle>
              </div>
              <div>
                <div className=" font-mono  ">{data.lotDescription}</div>
              </div>
            </div>
            <div className="w-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Кол-во
                </CardTitle>
              </div>
              <div>
                <div className=" font-mono  ">
                  {data.quantity} {data.unitOfMeasure}
                </div>
              </div>
            </div>
            <div className="w-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Спецификации
                </CardTitle>
              </div>
              <div>
                <div className=" font-mono  list-disc [&>li]:mt-2">
                  <ul>{data.lotAdditionalDescription}</ul>
                </div>
              </div>
            </div>
            <div className="w-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Адрес поставки
                </CardTitle>
              </div>
              <div>
                <div className=" font-mono  ">{data.deliveryPlaces}</div>
              </div>
            </div>
            <div className="w-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Срок поставки
                </CardTitle>
              </div>
              <div>
                <div className=" font-mono  ">{data.deliveryTerm}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TenderSkeleton() {
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

        <H4>Детали объявления</H4>
      </div>
      <div className="container lg:max-w-3xl mt-4">
        <div>
          <Skeleton className="w-full h-40 rounded-lg" />
        </div>
        <Tabs defaultValue="details" className="w-full mt-4">
          <TabsList className="mb-2">
            <TabsTrigger value="details">Детали объявления</TabsTrigger>
            <TabsTrigger value="candidates">Предложения от ИИ</TabsTrigger>
          </TabsList>
          <TabsContent value="candidates">
            <Skeleton className="w-full h-[1000px] rounded-lg" />
          </TabsContent>
          <TabsContent value="details">
            <Skeleton className="w-full h-[1000px] rounded-lg" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
