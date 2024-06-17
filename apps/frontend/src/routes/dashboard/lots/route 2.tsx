import { H4, Large, Lead, P } from "@/components/ui/typography";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Package } from "lucide-react";

import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { toast } from "sonner";
import { formatNumberWithCommas } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTenderDialog } from "@/components/addTenderDialog";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationPrevious,
	PaginationLink,
	PaginationEllipsis,
	PaginationNext,
} from "@/components/ui/pagination";
import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

const lotSearchSchema = z.object({
	page: z.number().catch(1),
	search: z.string().optional(),
	withRecommendations: z.boolean().catch(false),
});

export const Route = createFileRoute("/dashboard/lots/route 2")({
	component: () => <LotsPage />,
	pendingComponent: LoadingLotsPage,
	validateSearch: (search) => lotSearchSchema.parse(search),
});

const formSchema = z.object({
	search: z.string().optional(),
	withRecommendations: z.boolean().catch(false),
});

function LotsPage() {
	const { page, search, withRecommendations } = Route.useSearch();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			search: search,
			withRecommendations: withRecommendations,
		},
	});

	function onSubmit(data: z.infer<typeof formSchema>) {
		// console.log(data);
		navigation({
			to: "/dashboard/lots",
			search: {
				page: page,
				search: data.search,
				withRecommendations: data.withRecommendations,
			},
		});
	}

	const [limit, setLimit] = useState(30);
	const [{ lots, total }] = trpc.lot.getAllWithRecommendations.useSuspenseQuery(
		{
			limit: limit,
			page: page,
			search: search,
			withRecommendations: withRecommendations,
		},
	);
	const navigation = useNavigate();

	const [boards] = trpc.board.getAllByUser.useSuspenseQuery();
	const addToDealBoardMutation = trpc.lot.addToDealBoard.useMutation();
	const utils = trpc.useUtils();
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
									to: "/dashboard/feed/$boardId",
									params: { boardId },
								});
							},
						},
					});
					utils.board.getById.invalidate();
				},
			},
		);
	};
	return (
		<div className="w-full bg-background">
			<div className="flex h-16 items-center justify-start border-b px-4">
				<H4>Лоты, которые мы подобрали</H4>
			</div>
			<ScrollArea className="h-[calc(100vh-4rem)]">
				<div className="grid grid-cols-[300px_1fr]">
					<div className="border-r">
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
											<FormDescription>
												Поиск по названию, описанию, дополнительному описанию,
												цене покупки
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="withRecommendations"
									render={({ field }) => (
										<div className="items-top flex space-x-2 text-xs">
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
												id="recommendations"
											/>
											<div className="grid gap-1.5 leading-none">
												<label
													htmlFor="recommendations"
													className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												>
													Показывать только лоты с рекомендованными товарами
												</label>
												<p className="text-xs text-muted-foreground">
													ИИ ищет в интернете товары подходящие для лота.
												</p>
											</div>
										</div>
									)}
								/>
							</form>
						</Form>
					</div>

					<Pagination className="my-4">
						<PaginationContent>
							{page > 1 && (
								<PaginationItem>
									<Link
										to="/dashboard/lots"
										search={{ page: page - 1, withRecommendations }}
									>
										<PaginationPrevious />
									</Link>
								</PaginationItem>
							)}
							{Array.from({ length: Math.ceil(total / limit) }, (_, index) => {
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
							})}
							{page < Math.ceil(total / limit) && (
								<PaginationItem>
									<Link
										to="/dashboard/lots"
										search={{ page: page + 1, withRecommendations }}
									>
										<PaginationNext />
									</Link>
								</PaginationItem>
							)}
						</PaginationContent>
					</Pagination>
				</div>
			</ScrollArea>
		</div>
	);
}

function LoadingLotsPage() {
	return (
		<div className="w-full bg-background">
			<div className="flex h-16 items-center justify-start border-b px-4">
				<H4>Лоты, которые мы подобрали</H4>
			</div>
			<ScrollArea className="h-[calc(100vh-4rem)]">
				<div className="container mt-4 flex flex-col gap-4 lg:max-w-2xl">
					{Array.from({ length: 10 }).map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<div className="flex flex-col gap-2" key={index}>
							<Skeleton className="h-28 w-full" />
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
