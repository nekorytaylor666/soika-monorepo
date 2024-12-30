import React, { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
// Import Lucide React icons
import { Home, Building, User, Play, Flag, MessageCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { H1 } from "@/components/ui/typography";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { generateBotLink } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingFlow,
});

function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [user] = trpc.user.getUser.useSuspenseQuery();
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      organisation: "",
      firstName: "",
      lastName: "",
      bin: "",
    },
  });

  const { mutate: createOrganizationAndCompleteOnboarding } =
    trpc.user.createOrganizationAndCompleteOnboarding.useMutation();

  const handleNext = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handlePrevious = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleStepClick = (clickedStep: number) => {
    // Only allow moving to steps that have been unlocked
    if (clickedStep <= step) {
      setStep(clickedStep);
    }
  };
  const navigate = useNavigate();
  const onSubmit = (data: {
    firstName: string;
    lastName: string;
    organisation: string;
    bin: string;
  }) => {
    createOrganizationAndCompleteOnboarding(
      {
        name: `${data.firstName} ${data.lastName}`,
        organizationName: data.organisation,
        bin: data.bin,
      },
      {
        onSuccess: () => {
          toast.success("Онбординг завершен!");
          redirect({ to: "/dashboard" });
        },
      }
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle>
                <H1>Добро пожаловать на нашу платформу!</H1>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Мы рады видеть вас на борту. Давайте начнем настройку вашего
                аккаунта.
              </p>
            </CardContent>
            <CardFooter>
              <Button type="button" onClick={handleNext}>
                Далее
              </Button>
            </CardFooter>
          </>
        );
      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle>
                <H1>Информация о вас</H1>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Имя</Label>
                <Input {...register("firstName")} placeholder="Имя" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Фамилия</Label>
                <Input {...register("lastName")} placeholder="Фамилия" />
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Назад
              </Button>
              <Button type="button" onClick={handleNext}>
                Далее
              </Button>
            </CardFooter>
          </>
        );
      case 3:
        return (
          <>
            <CardHeader>
              <CardTitle>
                <H1>Расскажите нам о вашей организации</H1>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Название организации</Label>
                <Input
                  {...register("organisation")}
                  placeholder="Название организации"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>БИН/ИИН</Label>
                <Input {...register("bin")} placeholder="БИН/ИИН" />
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Назад
              </Button>
              <Button type="button" onClick={handleNext}>
                Далее
              </Button>
            </CardFooter>
          </>
        );

      case 4:
        return (
          <>
            <CardHeader>
              <CardTitle>
                <H1>Посмотрите наш продукт в действии</H1>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <video width="100%" controls>
                <source src="/path-to-your-demo-video.mp4" type="video/mp4" />
                Ваш браузер не поддерживает видео тег.
              </video>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Назад
              </Button>
              <Button type="button" onClick={handleNext}>
                Далее
              </Button>
            </CardFooter>
          </>
        );

      case 5:
        return (
          <>
            <CardHeader>
              <CardTitle>
                <H1>Подключите Telegram-бота</H1>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Для получения уведомлений и удобного взаимодействия с нашей
                платформой, пожалуйста, добавьте нашего Telegram-бота.
              </p>
              <Button
                variant="link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <a href={generateBotLink(user?.id)}>Добавить Telegram-бота</a>
              </Button>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Назад
              </Button>
              <Button type="button" onClick={handleNext}>
                Далее
              </Button>
            </CardFooter>
          </>
        );

      case 6:
        return (
          <>
            <CardHeader>
              <CardTitle>
                <H1>Всё готово!</H1>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Спасибо за завершение процесса онбординга. Теперь вы готовы
                начать использовать нашу платформу!
              </p>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Назад
              </Button>
              <Button type="submit">Начать работу</Button>
            </CardFooter>
          </>
        );
      default:
        return null;
    }
  };

  const steps = [
    { name: "Приветствие", icon: Home },
    { name: "Личная информация", icon: User },
    { name: "Организация", icon: Building },
    { name: "Демо продукта", icon: Play },
    { name: "Telegram-бот", icon: MessageCircle },
    { name: "Завершение", icon: Flag },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Timeline */}
      <div className="w-1/4 bg-muted p-8">
        <div className="space-y-8">
          {steps.map((stepItem, index) => (
            <div
              key={index}
              className={`flex items-center font-mono ${
                index + 1 === step ? "text-primary" : "text-muted-foreground"
              } ${index + 1 <= step ? "cursor-pointer" : "cursor-not-allowed"}`}
              onClick={() => handleStepClick(index + 1)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  index + 1 === step ? "bg-primary text-white" : "bg-zinc-200"
                }`}
              >
                {React.createElement(stepItem.icon, { size: 16 })}
              </div>
              <span>{stepItem.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="w-3/4 p-16">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="w-full max-w-2xl mx-auto border-none shadow-none">
            {renderStep()}
          </Card>
        </form>
      </div>
    </div>
  );
}

export default OnboardingFlow;
