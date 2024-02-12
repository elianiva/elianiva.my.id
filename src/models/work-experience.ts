export type WorkExperience = {
	company: string;
	position: string;
	type: "remote" | "onsite";
	period: [Date, Date];
	details: string[];
	technologies: string[];
};