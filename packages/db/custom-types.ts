import { customType } from "drizzle-orm/pg-core";

// biome-ignore lint/suspicious/noExplicitAny: any since its a json
export const jsonb = customType<{ data: any }>({
  dataType() {
    return "jsonb";
  },
  toDriver(val) {
    // biome-ignore lint/suspicious/noExplicitAny: any since its a json
    return val as any;
  },
  fromDriver(value) {
    // biome-ignore lint/suspicious/noExplicitAny: any since its a json
    if (typeof value === "string") {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: any since its a json
        return JSON.parse(value) as any;
      } catch {}
    }
    // biome-ignore lint/suspicious/noExplicitAny: any since its a json
    return value as any;
  },
});

export const tsVector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});
