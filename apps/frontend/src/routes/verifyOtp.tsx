import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase";
import { Label } from "@radix-ui/react-label";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import supertokensPasswordless from "supertokens-web-js/recipe/passwordless";
const emailVerifyOtpSchema = z.object({
  email: z.string().email(),
});

export const Route = createFileRoute("/verifyOtp")({
  component: () => <LoginForm />,
  validateSearch: (search) => emailVerifyOtpSchema.parse(search),
});

export function LoginForm() {
  const { email } = Route.useSearch();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, getValues, setValue } = useForm();
  const navigate = useNavigate();
  async function handleOTPInput(otp: string) {
    try {
      const response = await supertokensPasswordless.consumeCode({
        userInputCode: otp,
      });

      if (response.status === "OK") {
        // we clear the login attempt info that was added when the createCode function
        // was called since the login was successful.
        await supertokensPasswordless.clearLoginAttemptInfo();
        if (
          response.createdNewRecipeUser &&
          response.user.loginMethods.length === 1
        ) {
          // user sign up success
        } else {
          // user sign in success
        }
        // Check if user needs onboarding
        const needsOnboardingRes = await fetch(
          `${import.meta.env.VITE_API_DOMAIN}/trpc/user.isOnboarded`
        ).then((res) => res.json());
        const needsOnboarding = needsOnboardingRes.result.data.json;
        console.log("onboarding", needsOnboarding);
        if (!needsOnboarding) {
          navigate({ to: "/onboarding" });
        }
      } else if (response.status === "INCORRECT_USER_INPUT_CODE_ERROR") {
        // the user entered an invalid OTP
        window.alert(
          `Wrong OTP! Please try again. Number of attempts left: ${
            response.maximumCodeInputAttempts -
            response.failedCodeInputAttemptCount
          }`
        );
      } else if (response.status === "EXPIRED_USER_INPUT_CODE_ERROR") {
        // it can come here if the entered OTP was correct, but has expired because
        // it was generated too long ago.
        window.alert(
          "Old OTP entered. Please regenerate a new one and try again"
        );
      } else {
        // this can happen if the user tried an incorrect OTP too many times.
        // or if it was denied due to security reasons in case of automatic account linking

        // we clear the login attempt info that was added when the createCode function
        // was called - so that if the user does a page reload, they will now see the
        // enter email / phone UI again.
        await supertokensPasswordless.clearLoginAttemptInfo();
        window.alert("Login failed. Please try again");
        window.location.assign("/auth");
      }
    } catch (err: any) {
      if (err.isSuperTokensGeneralError === true) {
        // this may be a custom error message sent from the API by you.
        window.alert(err.message);
      } else {
        window.alert("Oops! Something went wrong.");
      }
    }
  }

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    await handleOTPInput(values.otp);
    setIsLoading(false);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex h-screen items-center justify-center">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Код подтверждения</CardTitle>
            <CardDescription>
              Введите свой одноразовый код ниже, чтобы подтвердить ваш аккаунт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2 justify-center">
                <Label htmlFor="email">Одноразовый код</Label>
                <InputOTP
                  name="otp"
                  onChange={(e) => setValue("otp", e)}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot className="size-12" index={0} />
                    <InputOTPSlot className="size-12" index={1} />
                    <InputOTPSlot className="size-12" index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot className="size-12" index={3} />
                    <InputOTPSlot className="size-12" index={4} />
                    <InputOTPSlot className="size-12" index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="w-full">
                {isLoading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  "Подтвердить"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
