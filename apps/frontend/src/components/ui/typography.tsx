import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const H1 = ({
	children,
	className,
}: { children: React.ReactNode; className?: string }) => {
	return <h1 className={cn("text-2xl font-bold", className)}>{children}</h1>;
};
const H2 = ({
	children,
	className,
}: { children: React.ReactNode; className?: string }) => {
	return (
		<h2
			className={cn(
				"scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
				className,
			)}
		>
			{children}
		</h2>
	);
};
const H3 = ({
	children,
	className,
}: { children: React.ReactNode; className?: string }) => {
	return (
		<h3
			className={cn(
				"scroll-m-20 text-2xl font-semibold tracking-tight",
				className,
			)}
		>
			{children}
		</h3>
	);
};

const H4 = ({
	className,
	...props
}: { className?: string; children: React.ReactNode }) => (
	<h4
		className={cn("text-xl font-medium tracking-tight", className)}
		{...props}
	/>
);

const P = ({
	className,
	children,
	...props
}: { className?: string; children: React.ReactNode }) => {
	return (
		<p className={cn("leading-7 ", className)} {...props}>
			{children}
		</p>
	);
};

const Lead = ({
	className,
	children,
	...props
}: { className?: string; children: React.ReactNode }) => {
	return (
		<p className={cn("text-xl text-muted-foreground", className)} {...props}>
			{children}
		</p>
	);
};

const Large = ({
	className,
	children,
	...props
}: { className?: string; children: React.ReactNode }) => {
	return (
		<div className={cn("text-lg font-semibold", className)} {...props}>
			{children}
		</div>
	);
};

const Small = ({
	className,
	children,
	...props
}: { className?: string; children: React.ReactNode }) => {
	return (
		<small
			className={cn("text-sm font-medium leading-none", className)}
			{...props}
		>
			{children}
		</small>
	);
};

const Muted = ({
	className,
	children,
	...props
}: { className?: string; children: React.ReactNode }) => {
	return (
		<p className={cn("text-sm text-muted-foreground", className)} {...props}>
			{children}
		</p>
	);
};

export { H4, H1, H2, H3, P, Lead, Large, Small, Muted };
