import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { H4 } from "@/components/ui/typography";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import { TenderProductTable } from "@/components/TenderProductTable";

export const Route = createFileRoute("/dashboard/products/$tenderId")({
	parseParams: (params) => ({
		tenderId: z.string().parse(params.tenderId),
	}),
	stringifyParams: ({ tenderId }) => ({ tenderId: `${tenderId}` }),
	loader: ({ params: { tenderId } }) => ({ tenderId }),
	component: () => <TenderPage />,
});

function TenderPage() {
	const { tenderId } = Route.useLoaderData();
	return (
		<div className="bg-background w-full">
			<div className="h-16 border-b px-4 flex justify-center items-center relative">
				<Link to="/dashboard/feed" className="absolute left-4">
					<Button variant="ghost" size={"icon"} asChild className="p-2">
						<ArrowLeft className="w-full" />
					</Button>
				</Link>
				<H4>Предлагаемые продукты для тендера</H4>
			</div>
			<div className="container  mt-4">
				<div className=" mt-4">
					<TenderProductTable />
				</div>
			</div>
		</div>
	);
}
