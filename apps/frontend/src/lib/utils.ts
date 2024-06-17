import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Active, DataRef, Over } from "@dnd-kit/core";
import type { ColumnDragData } from "@/components/BoardColumn";
import type { TaskDragData } from "@/components/TaskCard";

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
    sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "Bytes"
  }`;
}

export function isDev() {
  return process.env.NODE_ENV === "development";
}
