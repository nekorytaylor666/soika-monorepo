import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { H4, Large, Lead, P } from "@/components/ui/typography";
import { trpc } from "@/lib/trpc";
import { cn, formatNumberWithCommas } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashIcon } from "@radix-ui/react-icons";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import type {
  Board,
  Lot,
  RecommendedProduct,
  TradeMethod,
} from "db/schema/schema";
import {
  Check,
  ChevronsUpDown,
  Dot,
  MoreHorizontal,
  Package,
} from "lucide-react";
import { useState } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const lotSearchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().optional(),
  withRecommendations: z.boolean().catch(false),
  minBudget: z.number().optional(),
  maxBudget: z.number().optional(),
  tradeMethod: z.number().optional(),
});

const formSchema = z.object({
  search: z.string().optional(),
  withRecommendations: z.boolean().catch(false),
  minBudget: z.number().optional().catch(0),
  maxBudget: z.number().optional().catch(Number.MAX_SAFE_INTEGER),
  tradeMethod: z.number().optional(),
});

export const Route = createFileRoute("/dashboard/lots/")({
  component: () => <LotsPage />,
  pendingComponent: LoadingLotsPage,
  validateSearch: (search) => lotSearchSchema.parse(search),
});

function LotsPage() {
  const {
    page,
    search,
    withRecommendations,
    maxBudget,
    minBudget,
    tradeMethod,
  } = Route.useSearch();
  const [limit] = useState(10);
  const navigation = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search: search,
      withRecommendations: withRecommendations,
      tradeMethod: tradeMethod,
    },
  });

  const { data, isLoading } = trpc.lot.searchLots.useQuery({
    query: search ?? "",
    limit: 10,
    fullTextWeight: 0.5,
    semanticWeight: 0.5,
    minBudget: minBudget,
    maxBudget: maxBudget,
    tradeMethod: tradeMethod,
    withRecommendations: withRecommendations,
    rrfK: 50,
  });

  console.log(data);
  const [boards] = trpc.board.getAllByUser.useSuspenseQuery();
  const addToDealBoardMutation = trpc.lot.addToDealBoard.useMutation();
  const utils = trpc.useUtils();

  function onSubmit(values: z.infer<typeof formSchema>) {
    navigation({
      to: "/dashboard/lots",
      search: {
        page: 1,
        search: values.search,
        withRecommendations: values.withRecommendations,
        minBudget: values.minBudget,
        maxBudget: values.maxBudget,
        tradeMethod: values.tradeMethod,
      },
    });
  }

  const onAddToDealBoard = (lotId: number, boardId: string) => {
    addToDealBoardMutation.mutate(
      { lotId, boardId },
      {
        onSuccess: () => {
          toast("Лот добавлен в доску", {
            action: {
              label: "К доске",
              onClick: () => {
                navigation({
                  to: "/dashboard/boards/$boardId",
                  params: { boardId },
                });
              },
            },
          });
          utils.board.getById.invalidate();
        },
      }
    );
  };

  return (
    <div className="w-full bg-background">
      <div className="flex h-16 items-center justify-start border-b px-4">
        <H4>Лоты, которые мы подобрали</H4>
      </div>

      <div className="grid grid-cols-[400px_1fr]">
        <div className="border-r">
          <LotSearchForm
            form={form}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-4 container max-w-2xl">
            {/* {data?.results?.map((lot) => (
              <div key={lot.id}>
                {lot.lotName}
                {lot.lotDescription}
                {lot.lotAdditionalDescription}
              </div>
            ))} */}
            {!isLoading && data?.results ? (
              <LotList
                lots={data.results}
                boards={boards}
                onAddToDealBoard={onAddToDealBoard}
              />
            ) : (
              <LoadingLotsItems />
            )}
          </div>
          {/* <LotPagination
            page={page}
            limit={limit}
            withRecommendations={withRecommendations}
            hasMore={data?.hasMore}
            minBudget={minBudget}
            maxBudget={maxBudget}
            tradeMethod={tradeMethod}
            search={search}
          /> */}
        </ScrollArea>
      </div>
    </div>
  );
}

function LotSearchForm({
  form,
  onSubmit,
  isLoading,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}) {
  console.log(form.getValues("tradeMethod"));
  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 p-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Поиск</FormLabel>
              <FormControl>
                <Input
                  placeholder="Поиск по названию, описанию, дополнительному описанию, цене покупки"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormDescription>Поиск по названию, описанию, </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="withRecommendations"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Только рекомендованные
              </FormLabel>
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between gap-1">
          <Input
            {...form.register("minBudget", {
              valueAsNumber: true,
            })}
            type="number"
            placeholder="Мин. бюджет"
          />
          <DashIcon className="w-16" />
          <Input
            {...form.register("maxBudget", {
              valueAsNumber: true,
              required: false,
            })}
            type="number"
            placeholder="Макс. бюджет"
          />
        </div>
        <TradeMethodCombobox
          value={form.watch("tradeMethod")}
          onChange={(value) => {
            console.log("onChange", value);
            form.setValue("tradeMethod", value);
          }}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Поиск..." : "Поиск"}
        </Button>
      </form>
    </Form>
  );
}

export function TradeMethodCombobox({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  console.log("props", value, onChange);
  const { data: tradeMethods, isLoading } = trpc.lot.getTradeMethods.useQuery();
  if (isLoading) return <Skeleton className="w-full h-9" />;
  if (!tradeMethods) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? tradeMethods.find((tradeMethod) => tradeMethod.id === value)?.name
            : "Выберите способ закупки..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Поиск способа закупки..." />
          <CommandEmpty>Способ закупки не найден.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {tradeMethods.map((tradeMethod) => (
                <CommandItem
                  key={tradeMethod.id}
                  value={tradeMethod.id.toString()}
                  keywords={[tradeMethod.name]}
                  onSelect={(currentValue) => {
                    onChange(Number(currentValue));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === tradeMethod.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tradeMethod.name}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function LotList({
  lots,
  boards,
  onAddToDealBoard,
}: {
  lots: (Lot & { recommendedProducts: { id: number }[] })[];
  boards: Board[];
  onAddToDealBoard: (lotId: number, boardId: string) => void;
}) {
  return (
    <div className="p-4 container max-w-2xl flex flex-col gap-2">
      {lots.map((lot) => (
        <div className="flex flex-col gap-2 border-b pb-4" key={lot.id}>
          <div className="flex items-center justify-between gap-2">
            <Link to="/dashboard/lots/$lotId" params={{ lotId: lot.id }}>
              <Large className="cursor-pointer text-primary hover:underline">
                {lot.lotName}
              </Large>
            </Link>
            <Lead className="font-mono text-base whitespace-nowrap text-primary">
              {formatNumberWithCommas(lot.budget ?? 0)} KZT
            </Lead>
          </div>
          <P className="font-mono text-muted-foreground text-sm lowercase">
            {lot.lotDescription} {lot.lotAdditionalDescription}
          </P>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-mono">
              <P className="underline mr-4">{lot.refTradeMethods?.nameRu}</P>
              <Package className="size-4" />
              <P>{lot.recommendedProducts.length} Товар</P>
            </div>
            <Menubar className="border-none shadow-none">
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer hover:bg-muted">
                  <MoreHorizontal className="size-4" />
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem asChild>
                    <Link
                      to="/dashboard/lots/$lotId"
                      params={{ lotId: lot.id }}
                    >
                      Перейти к лоту <MenubarShortcut>⌘T</MenubarShortcut>
                    </Link>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Добавить в доску</MenubarSubTrigger>
                    <MenubarSubContent>
                      {boards.map((board) => (
                        <MenubarItem
                          key={board.id}
                          onClick={() => onAddToDealBoard(lot.id, board.id)}
                        >
                          # {board.name}
                        </MenubarItem>
                      ))}
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>
      ))}
    </div>
  );
}

function LotPagination({
  page,
  hasMore,
  limit,
  search,
  tradeMethod,
  withRecommendations,
  minBudget,
  maxBudget,
}: {
  page?: number;
  hasMore?: boolean;
  limit?: number;
  withRecommendations?: boolean;
  minBudget?: number;
  maxBudget?: number;
  search?: string;
  tradeMethod?: number;
}) {
  return (
    <div className="flex items-center justify-between border-t px-4 py-4">
      <Pagination className="my-4">
        <PaginationContent>
          {page > 1 && (
            <PaginationItem>
              <Link
                to="/dashboard/lots"
                search={{
                  page: page - 1,
                  withRecommendations,
                  minBudget,
                  maxBudget,
                  search,
                  tradeMethod,
                }}
              >
                <PaginationPrevious />
              </Link>
            </PaginationItem>
          )}
          {/* {Array.from({ length: Math.ceil(total / limit) }, (_, index) => {
						const pageNumber = index + 1;
						const isWithinRange =
							pageNumber === page ||
							(pageNumber >= page - 2 && pageNumber <= page + 2);
						return (
							isWithinRange && (
								<PaginationItem key={pageNumber}>
									<Link
										to="/dashboard/lots"
										disabled={pageNumber === page}
										search={{ page: pageNumber, withRecommendations }}
									>
										<PaginationLink
											className={
												pageNumber === page ? "bg-accent text-primary" : ""
											}
										>
											{pageNumber}
										</PaginationLink>
									</Link>
								</PaginationItem>
							)
						);
					})} */}
          {hasMore && (
            <PaginationItem>
              <Link
                to="/dashboard/lots"
                search={{
                  page: page + 1,
                  withRecommendations,
                  minBudget,
                  search,
                  tradeMethod,
                  maxBudget,
                }}
              >
                <PaginationNext />
              </Link>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function LoadingLotsPage() {
  return (
    <div className="w-full bg-background">
      <div className="flex h-16 items-center justify-start border-b px-4">
        <H4>Лоты, которые мы подобрали</H4>
      </div>
      <div className="grid grid-cols-[300px_1fr] h-[calc(100vh-4rem)]">
        <div className="border-r">
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        <div className="p-4 container max-w-2xl">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function LoadingLotsItems() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
