import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumberWithCommas } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { Deal } from "db/schema";
import { ClockIcon, DollarSign, GripVertical, Package } from "lucide-react";
import React, { useState } from "react";

interface DealCardProps {
  deal: Deal;
  isDragging: boolean;
  dragHandleProps: any;
}

const DealCard: React.FC<DealCardProps> = ({
  deal,
  isDragging,
  dragHandleProps,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      {...dragHandleProps}
      className={`min-h-[160px] ${isDragging ? "opacity-50" : ""}`}
    >
      <CardHeader className="px-4 pt-4 pb-0 flex flex-row items-center justify-between relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="link"
              className="px-0 text-accent-foreground w-56 text-left justify-start"
            >
              <Link to="/dashboard/deals/$dealId" params={{ dealId: deal.id }}>
                <p className="truncate w-56 font-semibold">
                  {deal.lot.lotName}
                </p>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent align="start">
            <p>{deal.lot.lotAdditionalDescription}</p>
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent className="px-4 pb-4 text-left whitespace-pre-wrap">
        <div
          className={`text-xs font-mono text-muted-foreground ${isExpanded ? "" : "h-16 overflow-hidden"}`}
        >
          {deal.lot.lotDescription} {deal.lot.lotAdditionalDescription}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium text-primary uppercase">
            Бюджет:
          </span>
          <div className="font-mono text-sm">
            {formatNumberWithCommas(deal.lot.budget ?? 0)}
            <span className="text-muted-foreground ml-1">₸</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealCard;
