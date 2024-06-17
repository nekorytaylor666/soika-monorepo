import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "sonner";
import {
	useQuery,
	useMutation,
	useQueryClient,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { trpc } from "./lib/trpc";
import { httpBatchLink } from "@trpc/client";
import { Providers } from "./components/shared/Providers";
import Passwordless from "supertokens-web-js/recipe/passwordless";
import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";

// Create a new router instance
const router = createRouter({ routeTree });
const queryClient = new QueryClient();
SuperTokens.init({
	appInfo: {
		apiDomain: "http://soika.gefest.agency",
		apiBasePath: "/auth",
		appName: "soika",
	},
	recipeList: [
		Session.init({
			tokenTransferMethod: "header", // or "cookie"
		}),
		Passwordless.init(),
	],
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
	root.render(
		<StrictMode>
			<Providers />
		</StrictMode>,
	);
}
