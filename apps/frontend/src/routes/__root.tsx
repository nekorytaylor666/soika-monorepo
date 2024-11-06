import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	createRootRoute,
	Outlet,
	ScrollRestoration,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<>
			<TooltipProvider>
				<Outlet />
				<ScrollRestoration />

				{/* <TanStackRouterDevtools /> */}
			</TooltipProvider>
		</>
	);
}
