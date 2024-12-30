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
import { ArrowLeft, Info, ListChecks } from "lucide-react";
import { z } from "zod";

import { TenderProductTable } from "@/components/TenderProductTable";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import {
  AddTaskForm,
  type AddTaskFormData,
} from "@/components/tasks/AddTaskForm";
import { DealTasks } from "@/components/tasks/TaskList";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import type { Deal, DealTask, Lot, RecommendedProduct } from "db/schema";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/deals/$dealId")({
  parseParams: (params) => ({
    dealId: z.string().parse(params.dealId),
  }),
  pendingComponent: TenderSkeleton,

  component: () => <TenderPage />,
});

function TenderPage() {
  const { dealId } = Route.useParams();
  const [deal] = trpc.deal.getById.useSuspenseQuery(dealId);
  const [value, setValue] = useState("");

  console.log(value);
  if (!deal || !deal.lot) {
    return <div>Deal not found</div>;
  }

  console.log(deal);
  const { lot } = deal;
  const { history } = useRouter();
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
      {/* <MinimalTiptapEditor
        value={value}
        onValueChange={setValue}
        outputValue="html"
        disabled={false}
        contentClass="max-w-3xl mx-auto mt-8"
      /> */}
      <div className="container lg:max-w-screen-2xl mt-4">
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
            <TabsTrigger value="details">
              <div className="flex items-center gap-1">
                <Info className="size-4" /> Детали объявления
              </div>
            </TabsTrigger>
            <TabsTrigger value="candidates">
              <div className="flex items-center gap-1">
                <ListChecks className="size-4" /> Задачи
              </div>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="candidates">
            <DealTaskTab dealId={dealId} tasks={deal.tasks} />
          </TabsContent>
          <TabsContent value="details">
            {lot && <TenderDetails data={lot} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DealTaskTab({ tasks, dealId }: { tasks: DealTask[]; dealId: string }) {
  const { mutate, isLoading } = trpc.deal.createTask.useMutation();
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();
  const addTask = (data: AddTaskFormData) => {
    mutate(
      { dealId, data },
      {
        onSuccess: () => {
          toast.success("Задача добавлена");
          setOpen(false);
          utils.deal.getById.invalidate(dealId);
        },
      }
    );
  };
  return (
    <div>
      <Card>
        <CardContent>
          <DealTasks tasks={tasks} dealId={dealId} />
        </CardContent>
      </Card>
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
      <div className="container lg:max-w-screen-2xl mt-4">
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
