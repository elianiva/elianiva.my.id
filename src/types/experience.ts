import type { Technology } from "./technology";

export type Experience = {
	title: string;
	time: [start: Date, end: Date | null];
	company: string;
	tasks: string[];
	images: string[];
	technologies: Technology[];
	type: "freelance" | "full-time";
};
