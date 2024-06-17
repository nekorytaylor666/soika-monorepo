import { ExternalLink, Refrigerator } from "lucide-react";
import { Button } from "./ui/button";
import { H4, Large, Muted, P, Small } from "./ui/typography";
import { Link } from "@tanstack/react-router";
import { KanbanBoard } from "./KanbanBoard";

function MainContent() {
	return (
		<div className="w-full bg-background/10">
			<div className="h-16 border-b px-4 flex items-center bg-background">
				<H4>Ваши сделки</H4>
			</div>
			<KanbanBoard />
			{/* <FeedItem />
				<FeedItem />
				<FeedItem /> */}
		</div>
	);
}

const FeedItem = () => {
	return (
		<Link to="/dashboard/$tenderId" params={{ tenderId: "1" }}>
			<div className="cursor-pointer flex pt-4 gap-4 w-full">
				<div className="border-2 h-min w-min rounded-lg p-2">
					<Refrigerator className="w-5 h-5" />
				</div>
				<div className="border-b pb-2 w-full">
					<Large>Новый тендер</Large>
					<Small className="font-normal">
						Холодильный аппарат с морозильным ларем
					</Small>
					<div className="flex justify-between items-center mt-1">
						<span className="text-xs text-muted-foreground">
							12.02.2024 12:00
						</span>
						<Button
							size={"icon"}
							variant={"link"}
							className=" text-muted-foreground"
						>
							<ExternalLink className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</Link>
	);
};

export default MainContent;
