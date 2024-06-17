import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { BoardColumn, BoardContainer } from "@/components/BoardColumn";
import {
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	useSensor,
	useSensors,
	KeyboardSensor,
	type Announcements,
	type UniqueIdentifier,
	TouchSensor,
	MouseSensor,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { type Task, TaskCard } from "@/components/TaskCard";
import type { Column } from "@/components/BoardColumn";
import { hasDraggableData } from "@/lib/utils";
import { coordinateGetter } from "@/components/multipleContainersKeyboardPreset";
import type {
	BoardDeal,
	Deal,
	Status,
} from "../../../backend/src/db/schema/schema";

interface KanbanBoardProps {
	statuses: Status[];
	deals: BoardDeal[];
}

export function KanbanBoard({ statuses, deals }: KanbanBoardProps) {
	const [columns, setColumns] = useState<Status[]>([]);

	const [tasks, setTasks] = useState<BoardDeal[]>([]);
	const [activeColumn, setActiveColumn] = useState<Status | null>(null);
	const [activeTask, setActiveTask] = useState<BoardDeal | null>(null);

	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor, { coordinateGetter }),
	);

	useEffect(() => {
		const columns = statuses.map((status) => ({
			id: status.id,
			title: status.status,
		}));

		const tasks = deals.map(({ id, deal, status }) => ({
			id,
			columnId: status.id,
			title: deal.lot.lotName,
			content: deal.lot.lotDescription,
			budget: deal.lot.budget,
			deadline: new Date(),
			lot: deal.lot.id,
		}));
		console.log(tasks);

		setColumns(columns);
		setTasks(tasks);
	}, [statuses, deals]);

	const announcements: Announcements = {
		onDragStart({ active }) {
			if (!hasDraggableData(active)) return;
			if (active.data.current?.type === "Column") {
				const startColumnIdx = columns.findIndex((col) => col.id === active.id);
				const startColumn = columns[startColumnIdx];
				return `Picked up Column ${startColumn?.title} at position: ${
					startColumnIdx + 1
				} of ${columns.length}`;
			}
			if (active.data.current?.type === "Task") {
				const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
					active.id,
					active.data.current.task.columnId,
				);
				return `Picked up Task ${
					active.data.current.task.content
				} at position: ${taskPosition + 1} of ${
					tasksInColumn.length
				} in column ${column?.title}`;
			}
		},
		onDragOver({ active, over }) {
			if (!hasDraggableData(active) || !hasDraggableData(over)) return;

			if (
				active.data.current?.type === "Column" &&
				over.data.current?.type === "Column"
			) {
				const overColumnIdx = columns.findIndex((col) => col.id === over.id);
				return `Column ${active.data.current.column.title} was moved over ${
					over.data.current.column.title
				} at position ${overColumnIdx + 1} of ${columns.length}`;
			}
			if (
				active.data.current?.type === "Task" &&
				over.data.current?.type === "Task"
			) {
				const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
					over.id,
					over.data.current.task.columnId,
				);
				if (
					over.data.current.task.columnId !== active.data.current.task.columnId
				) {
					return `Task ${
						active.data.current.task.content
					} was moved over column ${column?.title} in position ${
						taskPosition + 1
					} of ${tasksInColumn.length}`;
				}
				return `Task was moved over position ${taskPosition + 1} of ${
					tasksInColumn.length
				} in column ${column?.title}`;
			}
		},
		onDragEnd({ active, over }) {
			if (!hasDraggableData(active) || !hasDraggableData(over)) {
				return;
			}
			if (
				active.data.current?.type === "Column" &&
				over.data.current?.type === "Column"
			) {
				const overColumnPosition = columns.findIndex(
					(col) => col.id === over.id,
				);

				return `Column ${
					active.data.current.column.title
				} was dropped into position ${overColumnPosition + 1} of ${
					columns.length
				}`;
			}
			if (
				active.data.current?.type === "Task" &&
				over.data.current?.type === "Task"
			) {
				const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
					over.id,
					over.data.current.task.columnId,
				);
				if (
					over.data.current.task.columnId !== active.data.current.task.columnId
				) {
					return `Task was dropped into column ${column?.title} in position ${
						taskPosition + 1
					} of ${tasksInColumn.length}`;
				}
				return `Task was dropped into position ${taskPosition + 1} of ${
					tasksInColumn.length
				} in column ${column?.title}`;
			}
		},
		onDragCancel({ active }) {
			if (!hasDraggableData(active)) return;
			return `Dragging ${active.data.current?.type} cancelled.`;
		},
	};

	return (
		<DndContext
			accessibility={{
				announcements,
			}}
			sensors={sensors}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onDragOver={onDragOver}
		>
			<BoardContainer>
				<SortableContext items={columns.map((col) => col.id)}>
					{columns.map((col) => (
						<BoardColumn
							key={col.id}
							column={col}
							tasks={tasks.filter((task) => task.columnId === col.id)}
						/>
					))}
				</SortableContext>
			</BoardContainer>

			{"document" in window &&
				createPortal(
					<DragOverlay>
						{activeColumn && (
							<BoardColumn
								isOverlay
								column={activeColumn}
								tasks={tasks.filter(
									(task) => task.columnId === activeColumn.id,
								)}
							/>
						)}
						{activeTask && <TaskCard task={activeTask} isOverlay />}
					</DragOverlay>,
					document.body,
				)}
		</DndContext>
	);

	function getDraggingTaskData(taskId: UniqueIdentifier, columnId: ColumnId) {
		const tasksInColumn = tasks.filter((task) => task.columnId === columnId);
		const taskPosition = tasksInColumn.findIndex((task) => task.id === taskId);
		const column = columns.find((col) => col.id === columnId);
		return {
			tasksInColumn,
			taskPosition,
			column,
		};
	}

	function onDragStart(event: DragStartEvent) {
		if (!hasDraggableData(event.active)) return;
		const data = event.active.data.current;
		if (data?.type === "Column") {
			setActiveColumn(data.column);
			return;
		}

		if (data?.type === "Task") {
			setActiveTask(data.task);
			return;
		}
	}

	function onDragEnd(event: DragEndEvent) {
		setActiveColumn(null);
		setActiveTask(null);

		const { active, over } = event;
		if (!over) return;

		const activeId = active.id;
		const overId = over.id;

		if (!hasDraggableData(active)) return;

		const activeData = active.data.current;

		if (activeId === overId) return;

		const isActiveAColumn = activeData?.type === "Column";
		if (!isActiveAColumn) return;

		setColumns((columns) => {
			const activeColumnIndex = columns.findIndex((col) => col.id === activeId);

			const overColumnIndex = columns.findIndex((col) => col.id === overId);

			return arrayMove(columns, activeColumnIndex, overColumnIndex);
		});
	}

	function onDragOver(event: DragOverEvent) {
		const { active, over } = event;
		if (!over) return;

		const activeId = active.id;
		const overId = over.id;

		if (activeId === overId) return;

		if (!hasDraggableData(active) || !hasDraggableData(over)) return;

		const activeData = active.data.current;
		const overData = over.data.current;

		const isActiveATask = activeData?.type === "Task";
		const isOverATask = activeData?.type === "Task";

		if (!isActiveATask) return;

		// Im dropping a Task over another Task
		if (isActiveATask && isOverATask) {
			setTasks((tasks) => {
				const activeIndex = tasks.findIndex((t) => t.id === activeId);
				const overIndex = tasks.findIndex((t) => t.id === overId);
				const activeTask = tasks[activeIndex];
				const overTask = tasks[overIndex];
				if (
					activeTask &&
					overTask &&
					activeTask.columnId !== overTask.columnId
				) {
					activeTask.columnId = overTask.columnId;
					return arrayMove(tasks, activeIndex, overIndex - 1);
				}

				return arrayMove(tasks, activeIndex, overIndex);
			});
		}

		const isOverAColumn = overData?.type === "Column";

		// Im dropping a Task over a column
		if (isActiveATask && isOverAColumn) {
			setTasks((tasks) => {
				const activeIndex = tasks.findIndex((t) => t.id === activeId);
				const activeTask = tasks[activeIndex];
				if (activeTask) {
					activeTask.columnId = overId as Column["id"];
					return arrayMove(tasks, activeIndex, activeIndex);
				}
				return tasks;
			});
		}
	}
}
