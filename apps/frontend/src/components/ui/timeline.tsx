import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TimelineContentProps = {
	children: ReactNode;
};

const TimelineContent: React.FC<TimelineContentProps> = ({ children }) => (
	<div className={cn("w-full")}>{children}</div>
);
TimelineContent.displayName = "TimelineContent";

const TimelineDot: React.FC = () => (
	<div className={cn("h-3 w-3 bg-primary rounded-full")} />
);
TimelineDot.displayName = "TimelineDot";

type TimelineItemProps = {
	children: React.ReactNode;
	className?: string;
};

const TimelineItem: React.FC<TimelineItemProps> = ({ children, className }) => (
	<div className={cn("flex items-center w-full", className)}>
		<TimelineContent>{children}</TimelineContent>
	</div>
);
TimelineItem.displayName = "TimelineItem";

type TimelineProps = {
	children: React.ReactNode;
	className?: string;
};

const Timeline: React.FC<TimelineProps> = ({ children, className }) => {
	const timelineItems = React.Children.toArray(children);

	return (
		<div className={cn("flex flex-col items-center ", className)}>
			{timelineItems.map((child, index) => (
				<React.Fragment key={index}>
					{index > 0 && (
						<div
							className={cn("h-16 w-[2px] bg-muted-foreground self-center ")}
						/>
					)}
					{child}
				</React.Fragment>
			))}
		</div>
	);
};
Timeline.displayName = "Timeline";

export { Timeline, TimelineItem };
