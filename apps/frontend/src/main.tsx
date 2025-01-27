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
