export default {
	author: "elianiva",
	siteName: "elianiva's home row",
	siteUrl: import.meta.env.DEV
		? "http://localhost:4321"
		: "https://elianiva.my.id",
	github: "https://github.com/elianiva",
	bluesky: "https://bsky.app/profile/elianiva.my.id",
	twitter: "https://x.com/elianiva_",
	linkedin: "https://www.linkedin.com/in/dichaa",
	cv: "/assets/cv_dicha.pdf",
	email: "contact@elianiva.my.id",
	description: "elianiva's home row",
	keywords: ["personal", "website", "blog", "article", "portfolio", "elianiva"],
} as const;
