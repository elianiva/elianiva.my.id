export type WorkExperience = {
	company: string;
	position: string;
	location: string;
	time: "full-time" | "contract" | "freelance";
	period: [Date, Date | null];
	details: string[];
	technologies: string[];
};
