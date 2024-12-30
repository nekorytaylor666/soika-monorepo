import { MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Progress } from "./ui/progress";
import { Link } from "@tanstack/react-router";
import type { RecommendedProduct } from "db/schema";

export function TenderProductTable(props: {
  recommendedProducts: RecommendedProduct[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Название</TableHead>
          <TableHead>Цена</TableHead>
          <TableHead>Рейтинг</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.recommendedProducts.map((product) => (
          <TenderProductRow key={product.id} product={product} />
        ))}
      </TableBody>
    </Table>
  );
}

const TenderProductRow = (props: { product: RecommendedProduct }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <Button variant="link" className="text-accent-foreground px-0">
          <Link
            to="/dashboard/candidate/$recommendedId"
            params={{ recommendedId: props.product.id.toString() }}
          >
            <p className="w-72 truncate text-left">
              {props.product.productName}
            </p>
          </Link>
        </Button>
      </TableCell>
      <TableCell>
        {props.product.price}{" "}
        <span className="text-xs text-muted-foreground">
          {props.product.currency}/{props.product.unitOfMeasure}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-2 justify-center">
          <span className="text-sm font-medium">
            {props.product.complianceScore}/10
          </span>
          <Progress max={10} value={props.product.complianceScore * 10} />
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Действия</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link
                to="/dashboard/candidate/$recommendedId"
                params={{
                  recommendedId: props.product.id.toString(),
                }}
              >
                Посмотреть
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Удалить</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default TenderProductRow;
