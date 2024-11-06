import type { ColumnDragData } from "@/components/kanbanBoard/BoardColumn";
import type { TaskDragData } from "@/components/kanbanBoard/TaskCard";
import type { Active, DataRef, Over } from "@dnd-kit/core";
import type {
  ScheduleFrequency,
  TaskPriority,
  TaskStatus,
} from "db/schema/schema";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DraggableData = ColumnDragData | TaskDragData;

export function hasDraggableData<T extends Active | Over>(
  entry: T | null | undefined
): entry is T & {
  data: DataRef<DraggableData>;
} {
  if (!entry) {
    return false;
  }

  const data = entry.data.current;

  if (data?.type === "Column" || data?.type === "Task") {
    return true;
  }

  return false;
}
export function formatNumberWithCommas(number: number): string {
  return number.toLocaleString("en-US");
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: "accurate" | "normal";
  } = {}
) {
  const { decimals = 0, sizeType = "normal" } = opts;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(decimals)} ${
    sizeType === "accurate"
      ? (accurateSizes[i] ?? "Bytest")
      : (sizes[i] ?? "Bytes")
  }`;
}

export function isDev() {
  return process.env.NODE_ENV === "development";
}

export function getStatusLabel(status: TaskStatus) {
  const statuses: Record<TaskStatus, string> = {
    completed: "Выполнено",
    in_progress: "В процессе",
    not_started: "Не взято в работу",
  };
  return statuses[status];
}

export function getStatusColor(status: TaskStatus) {
  const statuses: Record<TaskStatus, { background: string; text: string }> = {
    completed: {
      background: "bg-green-500",
      text: "text-white",
    },
    in_progress: {
      background: "bg-blue-500",
      text: "text-white",
    },
    not_started: {
      background: "bg-red-500",
      text: "text-white",
    },
  };
  return statuses[status];
}

export const getStatusVariant = (status: TaskStatus) => {
  const statuses: Record<TaskStatus, "success" | "warning" | "secondary"> = {
    completed: "success",
    in_progress: "warning",
    not_started: "secondary",
  };
  return statuses[status];
};

export const getPriorityLabel = (priority: TaskPriority) => {
  const priorities: Record<TaskPriority, string> = {
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return priorities[priority];
};

export const getFrequencyLabel = (frequency: ScheduleFrequency) => {
  const frequencies: Record<ScheduleFrequency, string> = {
    daily: "Ежедневно",
    weekly: "Еженедельно",
    monthly: "Ежемесячно",
  };
  return frequencies[frequency];
};

export const generateBotLink = (profileId: string): string => {
  const encodedProfileId = btoa(profileId);

  return `https://t.me/soika_ai_bot?start=${encodedProfileId}`;
};
