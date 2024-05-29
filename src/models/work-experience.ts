export type WorkExperience = {
	company: string;
	position: string;
	type: "remote" | "onsite";
	period: [Date, Date | null];
	details: string[];
	technologies: string[];
};