import supertokens from "supertokens-node";
import * as trpcExpress from "@trpc/server/adapters/express";
import express from "express";
import cors from "cors";
import { middleware } from "supertokens-node/framework/express";
import { errorHandler } from "supertokens-node/framework/express";
import { appRouter, createContext } from "./trpc/appRouter";
import { supertokensConfig } from "./lib/supertokens";

const app = express();

supertokens.init(supertokensConfig);

app.use(
  cors({
    origin: process.env.WEBSITE_DOMAIN,
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    methods: ["GET", "PUT", "POST", "DELETE"],

    credentials: true,
  })
);

// IMPORTANT: CORS should be before the below line.
app.use(middleware());
app.use(errorHandler());

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
