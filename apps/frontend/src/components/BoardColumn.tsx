import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDndContext, type UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { type Task, TaskCard } from "./TaskCard";
import { cva } from "class-variance-authority";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { GripVertical } from "lucide-react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

export interface Column {
	id: UniqueIdentifier;
	title: string;
}

export type ColumnType = "Column";

export interface ColumnDragData {
	type: ColumnType;
	column: Column;
}

interface BoardColumnProps {
	column: Column;
	tasks: Task[];
	isOverlay?: boolean;
}

export function BoardColumn({ column, tasks, isOverlay }: BoardColumnProps) {
	const tasksIds = useMemo(() => {
		return tasks.map((task) => task.id);
	}, [tasks]);

	const {
		setNodeRef,
		attributes,
		listeners,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: column.id,
		data: {
			type: "Column",
			column,
		} satisfies ColumnDragData,
		attributes: {
			roleDescription: `Column: ${column.title}`,
		},
	});

	const style = {
		transition,
		transform: CSS.Translate.toString(transform),
	};

	const variants = cva(
		"h-[800px] max-h-[1000px] w-[400px] max-w-full  flex flex-col flex-shrink-0  snap-center border-0 bg-secondary/50",
		{
			variants: {
				dragging: {
					default: "border-2 border-transparent",
					over: "ring-2 ring-primary opacity-30",
					overlay: "ring-2 ring-primary",
				},
			},
		},
	);

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className={variants({
				dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
			})}
		>
			<CardHeader className="p-4 font-semibold  text-left flex flex-row space-between items-center ">
				<span className="mr-auto text-base">{column.title}</span>
				<Button
					variant={"ghost"}
					{...attributes}
					{...listeners}
					className=" p-1 text-primary/50 -ml-2 h-auto cursor-grab relative"
				>
					<span className="sr-only">{`Move column: ${column.title}`}</span>
					<GripVertical className="w-4 h-4" />
				</Button>
			</CardHeader>
			<ScrollArea>
				<CardContent className="flex flex-grow flex-col gap-2 p-2 max-w-full">
					<SortableContext items={tasksIds}>
						{tasks.map((task) => (
							<TaskCard key={task.id} task={task} />
						))}
					</SortableContext>
				</CardContent>
			</ScrollArea>
		</Card>
	);
}

export function BoardContainer({ children }: { children: React.ReactNode }) {
	const dndContext = useDndContext();

	const variations = cva(
		"w-auto max-w-full md:px-0 flex lg:justify-center pb-4",
		{
			variants: {
				dragging: {
					default: "snap-x snap-mandatory",
					active: "snap-none",
				},
			},
		},
	);

	return (
		<ScrollArea
			className={variations({
				dragging: dndContext.active ? "active" : "default",
			})}
		>
			<div className="flex w-full gap-4 pt-4 px-4 items-center flex-row justify-start">
				{children}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
}
