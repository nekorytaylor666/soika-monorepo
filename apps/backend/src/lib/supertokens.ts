import type { TypeInput } from "supertokens-node/lib/build/types";
import Session from "supertokens-node/recipe/session";
import Passwordless from "supertokens-node/recipe/passwordless";
import Dashboard from "supertokens-node/recipe/dashboard";
import { db } from "db/connection";
import { user } from "db/schema";

const connectionURI = process.env.SUPERTOKENS_CONNECTION_URI as string;
if (!connectionURI) {
  throw new Error("SUPERTOKENS_CONNECTION_URI is not set");
}

const appName = process.env.APP_NAME as string;
if (!appName) {
  throw new Error("APP_NAME is not set");
}

const apiDomain = process.env.API_DOMAIN as string;
if (!apiDomain) {
  throw new Error("API_DOMAIN is not set");
}

const websiteDomain = process.env.WEBSITE_DOMAIN as string;
if (!websiteDomain) {
  throw new Error("WEBSITE_DOMAIN is not set");
}

const apiBasePath = process.env.API_BASE_PATH as string;
if (!apiBasePath) {
  throw new Error("API_BASE_PATH is not set");
}

const websiteBasePath = process.env.WEBSITE_BASE_PATH as string;
if (!websiteBasePath) {
  throw new Error("WEBSITE_BASE_PATH is not set");
}

console.log("supertoken config:", {
  connectionURI,
  appName,
  apiDomain,
  apiBasePath,
  websiteBasePath,
});

const recipeList = [
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
                  // await db.insert(user).values({
                  //   email: emails[0],
                  //   name: "Аноним",
                  //   id,
                  // });
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
];

export const supertokensConfig = {
  supertokens: {
    // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
    connectionURI,
  },
  appInfo: {
    // learn more about this on https://supertokens.com/docs/session/appinfo
    appName,
    // apiDomain: "https://soika.gefest.agency",
    apiDomain,
    websiteDomain,
    apiBasePath,
    websiteBasePath,
  },
  recipeList,
} satisfies TypeInput;
