import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { H1, H3 } from "@/components/ui/typography";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Link, createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { RecommendedLots } from "db/schema/schema";
import { PackageSearchIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const Route = createLazyFileRoute("/dashboard/")({
  component: HomePage,
});

function HomePage() {
  const [user] = trpc.user.getUser.useSuspenseQuery();
  const organizationId = user?.organizations[0].organizationId;
  const { data: recommendedLots } =
    trpc.recommendedLots.getFreshResults.useQuery(
      {
        organizationId: organizationId ?? "",
      },
      { enabled: !!organizationId }
    );

  const form = useForm({
    defaultValues: {
      search: "",
    },
  });

  const navigate = useNavigate();
  const onSubmit = (data: any) => {
    console.log(data);
    navigate({
      to: "/dashboard/lots",
      search: { search: data.search, page: 1, withRecommendations: false },
    });
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 container max-w-screen-lg">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="text-center mb-8 gap-4 flex flex-col w-full justify-center items-center">
          <H1 className="text-3xl">Найди свой следующий контракт</H1>
          <p className="text-base mb-4 font-mono text-primary">
            Введите описание госзаказа и мы найдем для вас лучшие тендеры
          </p>
          <div className="w-full flex gap-2">
            <Input
              {...form.register("search")}
              className="w-full max-w-2xl text-xl p-6 placeholder:font-mono"
              placeholder="Какой госзаказ вы ищете?"
            />
            <Button variant={"outline"} className="h-12" type="submit">
              <SearchIcon className="h-5 w-5 mr-2" />
              Найти
            </Button>
          </div>
        </div>
      </form>

      <div className="text-center mt-12">
        <p className="text-base mb-4 font-mono text-muted-foreground">
          Мы подготовили для вас несколько рекомендаций по тендерам.
        </p>
        <Button
          variant={"secondary"}
          asChild
          size={"sm"}
          disabled={!recommendedLots}
        >
          <Link
            to="/dashboard/recommendations/$recommendedId"
            params={{ recommendedId: recommendedLots?.id ?? "" }}
          >
            Посмотреть рекомендации на{" "}
            {recommendedLots?.createdAt &&
              format(recommendedLots?.createdAt, "dd MMMM", { locale: ru })}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
