import TenderProductTable from "@/components/TenderProductTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import customNode from "@/components/ui/custom-node";
import {
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { H4, Large } from "@/components/ui/typography";
import "reactflow/dist/style.css";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { formatNumberWithCommas } from "@/lib/utils";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bird,
  Book,
  Bot,
  Code2,
  LifeBuoy,
  Rabbit,
  Settings,
  Settings2,
  Share,
  SquareTerminal,
  SquareUser,
  Triangle,
  Turtle,
} from "lucide-react";
import { useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  addEdge,
} from "reactflow";
import { Drawer } from "vaul";
import { z } from "zod";

export const Route = createFileRoute("/dashboard/candidate/$recommendedId")({
  component: ProductCandidatePage,
  parseParams: (params) => ({
    recommendedId: z.string().parse(params.recommendedId),
  }),
  pendingComponent: ProductCandidateSkeleton,
});

function ProductCandidatePage() {
  const { recommendedId } = Route.useParams();
  const [candidate] =
    trpc.recommendedProducts.getById.useSuspenseQuery(recommendedId);

  return (
    <main className="  flex-1 gap-4 overflow-auto  bg-background">
      <div
        className="relative hidden flex-col items-start md:flex "
        x-chunk="dashboard-03-chunk-0"
      >
        <div className="h-16 border-b flex justify-center items-center relative w-full">
          <Button
            onClick={() => history.back()}
            variant="ghost"
            size={"icon"}
            className="p-2 absolute left-4"
          >
            <ArrowLeft className="w-full" />
          </Button>

          <H4>Рекомендация для лота {candidate?.lotId}</H4>
        </div>
        <div className="container max-w-3xl">
          <div className="flex flex-col gap-4 pt-4">
            <div className="w-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Название продукта
                </CardTitle>
              </div>
              <div>
                <Button
                  asChild
                  variant={"link"}
                  className="text-lg font-mono px-0 text-muted-foreground"
                >
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={candidate?.sourceUrl ?? ""}
                  >
                    {candidate?.productName}
                  </a>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2">
              <div className="w-full">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">
                    Цена
                  </CardTitle>
                </div>
                <div>
                  <div className="text-lg font-mono">
                    {formatNumberWithCommas(candidate?.price ?? 0)}{" "}
                    {candidate?.currency}
                  </div>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-primary">
                        Рейтинг
                      </CardTitle>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="text-lg font-mono">
                        {candidate?.complianceScore}/10
                      </div>
                      <Progress
                        value={(candidate?.complianceScore ?? 0) * 10}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Насколько продукт соответствует технической Спецификации по
                    мнению ИИ
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="w-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Описание
                </CardTitle>
              </div>
              <div>
                <div className=" font-mono">
                  {candidate?.productDescription}
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
                  {candidate?.productSpecifications}
                </div>
              </div>
            </div>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Почему такой рейтинг?</AccordionTrigger>
                <AccordionContent className="font-mono">
                  {candidate?.complianceDetails}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProductCandidateSkeleton() {
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

        <H4>Рекомендация для лота</H4>
      </div>
      <div className="container lg:max-w-3xl mt-4" />
    </div>
  );
}
