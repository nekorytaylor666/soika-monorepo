import { tool } from "ai";
import { z } from "zod";
import { db } from "db/connection";
import { eq } from "drizzle-orm";
import { lots } from "db/schema";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const createLotTools = (lotId: number) => ({
  readLotFile: tool({
    description: "Read the contents of a file attached to the lot",
    parameters: z.object({
      fileName: z.string().describe("The name of the file to read"),
    }),
    execute: async ({ fileName }) => {
      try {
        const lot = await db.query.lots.findFirst({
          where: eq(lots.id, lotId),
        });

        if (!lot?.files) {
          return "No files found for this lot";
        }

        const file = lot.files.find((f) => f.nameRu === fileName);
        if (!file) {
          return `File ${fileName} not found. Available files: ${lot.files
            .map((f) => f.nameRu)
            .join(", ")}`;
        }

        const filePath = path.join(
          process.env.UPLOAD_DIR || "uploads",
          file.filePath,
        );
        const content = await readFile(filePath, "utf-8");
        return content;
      } catch (error) {
        console.error("Error reading file:", error);
        return "Error reading file";
      }
    },
  }),

  searchWeb: tool({
    description:
      "Поиск в интернете информации о продуктах, компаниях или рыночных данных",
    parameters: z.object({
      query: z.string().describe("Поисковый запрос"),
    }),
    execute: async ({ query }) => {
      try {
        const response = await fetch("https://s.jina.ai/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${process.env.JINA_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: query }),
        });

        if (!response.ok) {
          throw new Error(`Jina API request failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let result = "";
        let done = false;

        while (!done) {
          const { value, done: readerDone } = (await reader?.read()) || {};
          done = readerDone;
          result += decoder.decode(value, { stream: !done });
        }

        const data = JSON.parse(result);

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response format");
        }

        return data.slice(0, 2).map((item) => ({
          title: item.title,
          description: item.description,
          url: item.url,
          content: item.content,
        }));
      } catch (error) {
        console.error("Error searching web:", error);
        return "Error performing web search";
      }
    },
  }),
});
