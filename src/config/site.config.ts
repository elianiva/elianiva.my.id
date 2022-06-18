export interface SiteConfig {
	description: string;
	site: {
		name: string;
		url: string;
	};
	contact: {
		github: string;
		twitter: string;
		email: string;
	};
	keywords: string[];
	type: "blog" | "website";
}

export const config: SiteConfig = {
	description: "elianiva's personal website",
	site: {
		name: "elianiva.my.id",
		url: "https://elianiva.my.id",
	},
	contact: {
		github: "https://github.com/elianiva",
		twitter: "https://twitter.com/@elianiva_",
		email: "dicha.arkana03@gmail.com",
	},
	keywords: ["personal website", "blog", "article"],
	type: "website",
};
