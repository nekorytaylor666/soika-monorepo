import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { appRouter } from "./trpc/appRouter";
import { convertToCoreMessages, streamText } from "ai";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { deepseek } from "@ai-sdk/deepseek";
import { chatRouter } from "./chat";
import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import type { Env } from "./env";
import { createContext } from "./trpc";
import { db as dbConnection } from "db/connection";
const app = new Hono<Env>();

// CORS middleware
app.use(
  "*", // or replace with "*" to enable cors for all routes
  cors({
    origin: ["http://localhost:5173", "https://soika-frontend.pages.dev"], // replace with your origin
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);
// JSON parsing error handling
app.onError((err, c) => {
  if (err instanceof SyntaxError) {
    return c.json(
      {
        error: "Invalid JSON payload",
        details: err.message,
      },
      400,
    );
  }
  return c.json({ error: err.message }, 500);
});

// Auth routes

app.use("*", async (c, next) => {
  console.log(c.req.raw.headers);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  console.log(session);
  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
    console.log("user", c.get("user"));
    console.log("session", c.get("session"));
    return next();
  }

  return next();
});

app.route("/api/chat", chatRouter);

app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (opts, c) => {
      return {
        db: dbConnection,
        user: c.get("user"),
        session: c.get("session"),
      };
    },
  }),
);

export default {
  port: 3000,
  fetch: app.fetch,
};
