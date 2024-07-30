import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import posthog from "posthog-js";
import { Toaster } from "sonner";
import SuperTokens from "supertokens-web-js";
import Passwordless from "supertokens-web-js/recipe/passwordless";
import Session from "supertokens-web-js/recipe/session";
import { Providers } from "./components/shared/Providers";
import { ThemeProvider } from "./components/theme-provider";
import { trpc } from "./lib/trpc";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
console.log(import.meta.env.VITE_API_DOMAIN);
const router = createRouter({ routeTree });
const queryClient = new QueryClient();
SuperTokens.init({
  appInfo: {
    // apiDomain: "https://soika.gefest.agency",
    apiDomain: import.meta.env.VITE_API_DOMAIN,
    apiBasePath: "/auth",
    appName: "soika",
  },
  recipeList: [
    Session.init({
      tokenTransferMethod: "header", // or "cookie"
      onHandleEvent: (context) => {
        console.log(context);

        if (context.action === "SIGN_OUT") {
          // called when the user clicks on sign out
        } else if (context.action === "REFRESH_SESSION") {
          // called with refreshing a session
          // NOTE: This is an undeterministic event
        } else if (context.action === "UNAUTHORISED") {
          // called when the user doesn't have a valid session but made a request that requires one
          // NOTE: This event can fire multiple times

          if (context.sessionExpiredOrRevoked) {
            // the sessionExpiredOrRevoked property is set to true if the current call cleared the session from storage
            // this happens only once, even if multiple tabs sharing the same session are open, making it useful for analytics purposes
          }
        } else if (context.action === "SESSION_CREATED") {
          // Called when session is created - post login / sign up.
        } else if (context.action === "ACCESS_TOKEN_PAYLOAD_UPDATED") {
          // This is called when the access token payload has been updated
        } else if (context.action === "API_INVALID_CLAIM") {
          // This is called when the access token payload has an invalid claim
          // as per one of the validators on the frontend
        } else if (context.action === "SESSION_ALREADY_EXISTS") {
          // called when a user visits the login / sign up page with a valid session
          // in this case, they are usually redirected to the main app
        }
      },
    }),
    Passwordless.init(),
  ],
});

posthog.init("phc_Qf40Egw56wbdjSt2SEp6RdkITSBFafpKRb0OJU9iGHg", {
  api_host: "https://us.i.posthog.com",
  person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Providers />);
}
