import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Passwordless from "supertokens-node/recipe/passwordless";
import * as trpcExpress from "@trpc/server/adapters/express";
import Dashboard from "supertokens-node/recipe/dashboard";

supertokens.init({
  framework: "express",
  supertokens: {
    // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
    connectionURI: "http://soika.gefest.agency:3567",
    // apiKey: <API_KEY(if configured)>,
  },
  appInfo: {
    // learn more about this on https://supertokens.com/docs/session/appinfo
    appName: "Soika",
    apiDomain: "http://soika.gefest.agency",
    websiteDomain: "https://soika-frontend.pages.dev/",
    apiBasePath: "/auth",
    websiteBasePath: "/auth",
  },
  recipeList: [
    Session.init({
      getTokenTransferMethod: () => "header",
    }),
    Dashboard.init(),

    Passwordless.init({
      flowType: "USER_INPUT_CODE",
      contactMethod: "EMAIL",
      override: {
        functions: (originalImplementation) => {
          return {
            ...originalImplementation,
            consumeCode: async (input) => {
              // First we call the original implementation of consumeCode.
              const response = await originalImplementation.consumeCode(input);

              // Post sign up response, we check if it was successful
              if (response.status === "OK") {
                const { id, emails, phoneNumbers } = response.user;

                if (input.session === undefined) {
                  if (
                    response.createdNewRecipeUser &&
                    response.user.loginMethods.length === 1
                  ) {
                    await db.insert(profile).values({
                      email: emails[0],
                      name: "Аноним",
                      id,
                    });
                    // TODO: post sign up logic
                  } else {
                    // TODO: post sign in logic
                  }
                }
              }
              return response;
            },
          };
        },
      },
    }),
  ],
});
import express from "express";
import cors from "cors";
import { middleware } from "supertokens-node/framework/express";
import { errorHandler } from "supertokens-node/framework/express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import type { SessionRequest } from "supertokens-node/framework/express";
import { appRouter, createContext } from "./trpc/appRouter";
import { db } from "./db/connection";
import { profile } from "./db/schema/schema";

const app = express();

app.use(
  cors({
    origin: "https://soika-frontend.pages.dev",
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
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
