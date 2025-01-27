import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginForm,
});

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.signIn.email(
        {
          email: values.email,
          password: values.password,
        },
        {
          onRequest: () => {
            setIsLoading(true);
          },
          onSuccess: async () => {
            // const needsOnboardingRes = await fetch(
            //   `${import.meta.env.VITE_API_DOMAIN}/trpc/user.isOnboarded`
            // ).then((res) => res.json());
            // const needsOnboarding = needsOnboardingRes.result.data.json;
            // console.log("onboarding", needsOnboarding);
            // if (!needsOnboarding) {
            navigate({ to: "/dashboard" });
            //   navigate({ to: "/onboarding" });
            // } else {
            //   navigate({ to: "/dashboard" });
            // }
          },
          onError: (ctx) => {
            window.alert(ctx.error.message);
          },
        }
      );

      if (error) {
        window.alert(error.message);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex h-screen items-center justify-center">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Вход</CardTitle>
            <CardDescription>
              Введите свой email и пароль, чтобы войти в свой аккаунт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  {...register("password")}
                  id="password"
                  type="password"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                {isLoading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  "Войти"
                )}
              </Button>
              <Button variant="outline" className="w-full">
                Войти с Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Нет аккаунта?{" "}
              <Link to="/signup" className="underline">
                Зарегистрироваться
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
