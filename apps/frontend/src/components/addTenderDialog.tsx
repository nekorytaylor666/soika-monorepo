import { Loader, Plus, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { FileUploader } from "./file-uploader";
import { Button } from "./ui/button";
import {
	DialogHeader,
	DialogFooter,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

export function AddTenderDialog() {
	const [files, setFiles] = React.useState<File[]>([]);
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [job, setJob] = React.useState<null | { id: string; status: string }>(
		null,
	);
	const navigate = useNavigate({ from: "/dashboard" });
	const [budget, setBudget] = useState<number>(0);
	const [markdown, setMarkdown] = React.useState<string | null>(null);
	const startTechnicalSpecificationParse = useMutation({
		mutationFn: () => {
			const formData = new FormData();
			formData.append("file", files[0]);
			formData.append("budget", budget.toString());
			return axios.post(
				"https://backend.akmt-me23.workers.dev/tenders/70529575-ЗЦП1/extract-specs",
				formData,
			);
		},
		onSuccess: (data) => {
			toast.success("Лот добавлен!");
			navigate({
				to: "/dashboard/lots",
			});
		},
	});

	const onSubmit = () => {
		console.log(files);
		startTechnicalSpecificationParse.mutate();
	};
	const onUpload = async (files: File[]) => {
		setFiles(files);
	};
	console.log(markdown);

	return (
		<div className="flex justify-between items-center ">
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogTrigger asChild>
					<Button>
						<Plus className="size-4 mr-1" />
						Добавить сделку
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Добавить сделку</DialogTitle>
						<DialogDescription>
							Переложи файлы сюда или кликни для выбора файлов. Остальное мы
							сделаем сами!
						</DialogDescription>
					</DialogHeader>
					<div>
						{startTechnicalSpecificationParse.isLoading ? (
							<div className="flex flex-col gap-4 justify-center items-center w-full h-52 border-2 border-dashed rounded-lg border-muted-foreground/25 px-5 py-2.5 text-center">
								<div className="text-muted-foreground">
									Создаем сделку с щепоткой магии...
								</div>
								<Loader className="animate-spin size-8 " />
							</div>
						) : (
							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-2">
									<Label>Бюджет</Label>
									<Input
										defaultValue={0}
										className="font-mono"
										type="number"
										value={budget}
										onChange={(e) => setBudget(Number(e.target.value))}
										placeholder="Бюджет"
									/>
									<div className="text-muted-foreground text-xs">
										Планируемая закупочная стоимость в тенге.
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label>Техническая спецификация</Label>
									<FileUploader
										maxFiles={8}
										value={files}
										maxSize={8 * 1024 * 1024}
										onUpload={onUpload}
									/>
								</div>
							</div>
						)}
					</div>
					<div>{markdown && <div className="prose">{markdown}</div>}</div>

					<DialogFooter>
						<Button onClick={onSubmit}>
							<Sparkles className="size-4 mr-1" />
							Добавить
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
