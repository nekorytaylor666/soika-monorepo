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
import { LoaderCircle, Upload } from "lucide-react";
import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  component: SignUpForm,
});

interface SignUpFormData {
  email: string;
  password: string;
  name: string;
}

function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const onSubmit = async (values: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.signUp.email(
        {
          email: values.email,
          password: values.password,
          name: values.name,
          image: image ? await convertImageToBase64(image) : undefined,
        },
        {
          onRequest: () => {
            setIsLoading(true);
          },
          onSuccess: async () => {
            const needsOnboardingRes = await fetch(
              `${import.meta.env.VITE_API_DOMAIN}/trpc/user.isOnboarded`
            ).then((res) => res.json());
            const needsOnboarding = needsOnboardingRes.result.data.json;
            console.log("onboarding", needsOnboarding);
            if (!needsOnboarding) {
              navigate({ to: "/onboarding" });
            } else {
              navigate({ to: "/dashboard" });
            }
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
            <CardTitle className="text-2xl">Регистрация</CardTitle>
            <CardDescription>
              Создайте новый аккаунт, чтобы начать работу
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
              <div className="grid gap-2">
                <Label htmlFor="name">Имя</Label>
                <Input {...register("name")} id="name" type="text" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Фото профиля</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {image && (
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Preview"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {isLoading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  "Зарегистрироваться"
                )}
              </Button>
              <Button variant="outline" className="w-full">
                Войти с Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="underline">
                Войти
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
