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
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useTrpc } from "@/hooks/useTrpc";
import { createCode } from "supertokens-web-js/recipe/passwordless";

export const Route = createFileRoute("/login")({
	component: LoginForm,
});

export function LoginForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	async function sendOTP(email: string) {
		try {
			const response = await createCode({
				email,
			});
			/**
         * For phone number, use this:
            
            let response = await createPasswordlessCode({
                phoneNumber: "+1234567890"
            });
         
        */

			if (response.status === "SIGN_IN_UP_NOT_ALLOWED") {
				// the reason string is a user friendly message
				// about what went wrong. It can also contain a support code which users
				// can tell you so you know why their sign in / up was not allowed.
				window.alert(response.reason);
			} else {
				// OTP sent successfully.
				window.alert("Please check your email for an OTP");
			}
		} catch (err: any) {
			if (err.isSuperTokensGeneralError === true) {
				// this may be a custom error message sent from the API by you,
				// or if the input email / phone number is not valid.
				window.alert(err.message);
			} else {
				console.log(err);
				window.alert("Oops! Something went wrong.");
			}
		}
	}
	const onSubmit = async (values: any) => {
		setIsLoading(true);
		await sendOTP(values.email);

		setIsLoading(false);
		navigate({
			to: "/verifyOtp",
			search: {
				email: values.email,
			},
		});
	};
	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<div className="flex h-screen items-center justify-center">
				<Card className="mx-auto max-w-sm">
					<CardHeader>
						<CardTitle className="text-2xl">Вход</CardTitle>
						<CardDescription>
							Введите свой email ниже, чтобы войти в свой аккаунт
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
							<Link href="#" className="underline">
								Зарегистрироваться
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</form>
	);
}
