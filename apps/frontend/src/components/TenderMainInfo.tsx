import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Large, Small } from "@/components/ui/typography";
import {
  ScrollText,
  HandCoins,
  CalendarClock,
  Hash,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "./ui/separator";

interface TenderMainInfoProps {
  tenderName: string;
  tenderStatus: string;
  totalCost: string;
  deadline: string;
  tenderNumber: string;
}

const TenderMainInfo: React.FC<TenderMainInfoProps> = ({
  tenderName,
  tenderStatus,
  totalCost,
  deadline,
  tenderNumber,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 bg-muted flex items-center justify-center rounded-md">
              <ScrollText />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse absolute -bottom-1 -right-1" />
            </div>
            <div className="h-12">
              <Large className="capitalize w-[500px] text-ellipsis overflow-hidden whitespace-nowrap">
                {tenderName}
              </Large>
              <Small className="text-muted-foreground">{tenderStatus}</Small>
            </div>
          </div>
          <div>
            <Button
              variant="ghost"
              size={"icon"}
              asChild
              className="p-2 cursor-pointer"
            >
              <ExternalLink />
            </Button>
          </div>
        </div>
      </CardHeader>
      <Separator className="mb-4" />
      <CardContent className="grid gap-2">
        <div className="flex gap-4 items-center justify-between">
          <div className="w-full">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Общая стоимость
              </CardTitle>
              <HandCoins className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-lg font-mono">{totalCost}</div>
            </div>
          </div>

          <Separator orientation="vertical" />
          <div className="w-full">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Номер объявления
              </CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-lg font-mono">{tenderNumber}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenderMainInfo;
