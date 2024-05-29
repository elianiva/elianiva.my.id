import type { WorkExperience } from "~/models/work-experience.ts";

export const workExperiences: WorkExperience[] = [
	{
		company: "PT Global Scholarship Services Indonesia (IPBTraining)",
		position: "Fullstack Web Developer",
		type: "remote",
		period: [new Date(2024, 3), null],
		details: [
			"Initiated the use of Github Action for CI/CD pipeline",
			"Used Javascript and Typescript to build and maintain learning platform",
			"Instrumented Sentry for better tracing and better error reporting to improve bug fixing downtime.",
		],
		technologies: [
			"typescript",
			"nodejs",
			"nextjs",
			"laravel",
			"mysql",
			"docker"
		]
	},
	{
		company: "PT Healstation Indonesia",
		position: "Fullstack Web Developer",
		type: "remote",
		period: [new Date(2023, 0), new Date(2023, 3)],
		details: [
			"Building Content Management System for a South Korean mobile app that accommodates car, camp car, and camping site rent in one app",
			"Designed the database schema along with other developer",
			"Uses Next.js with Typescript, tRPC, Prisma, and Tailwind to maximise the development speed and user experience of the CMS",
			"Utilises MySQL as the database and MinIO/S3 as the object storage",
			"Using Docker for both local development setup and easy deployment solution"
		],
		technologies: [
			"typescript",
			"nextjs",
			"trpc",
			"mysql",
			"minio",
			"docker"
		]
	},
	{
		company: "Cubix Branding Agency",
		position: "Fullstack Web Developer",
		type: "remote",
		period: [new Date(2022, 5), new Date(2023, 2)],
		details: [
			"Developed three responsive websites for Artajasa, ATMBersama, and Bersama respectively based on the provided design on Figma",
			"Worked in team with 3 other developers using Github",
			"Uses NextJS with Typescript to provide type-safety when developing the website. Also uses SCSS, Stitches, and SCSS Module to style each of the websites.",
			"Applied ISR pattern to improve performance and uses SWR for easier data fetching on the client",
			"Integrate the data that comes from Laravel with Voyager CMS to the website to provide dynamic content",
			"Helped refactoring and fixing any bugs that occured on both the frontend and backend"
		],
		technologies: [
			"typescript",
			"nextjs",
			"scss",
			"php",
			"laravel",
			"voyager",
		]
	},
	{
		company: "<Undisclosed>",
		position: "Fullstack Web Developer",
		type: "remote",
		period: [new Date(2021, 11), new Date(2022, 8)],
		details: [
			"Built a platform to do programming test similar to Codewars and HackerRank with multilingual support that also tracks the user activity such as mouse clicks, mouse movements, keystroke events, etc. since its main purpose is to collect data to be then used for research. Now published as teknologi-umum/spectator",
			"Collaborate with various developers using Git and Github",
			"Uses React with Typescript, Redux Toolkit, ChakraUI to build the frontend and utilised SignalR to send activity data to the ASP.NET Core backend. Used Vitest and React Testing Library to do unit test",
			"Helped developing the data calculation worker along with its unit test. The worker is written in Go and uses gRPC to communicate with the ASP.NET Core backend. It queries the data from InfluxDB and write the result to MinIO bucket as CSV and JSON.",
			"Made a video stream feature which streams video output from the webcam to ASP.NET Core backend through HTTP",
			"Assisted with developing the Remote Code Execution engine written in Typescript that uses gRPC to communicate with other services which then got open sourced as teknologi-umum/pesto",
			"Helped developing a dummy data generator using Python to generate thousand of fake user interaction activity data along with the unit test",
			"Used Docker to make it easier to develop and deploy each services",
		],
		technologies: [
			"typescript",
			"react",
			"redux-toolkit",
			"chakra-ui",
			"signalr",
			"aspnet-core",
			"grpc",
			"go",
			"influxdb",
			"minio",
			"python",
			"docker"
		]
	},
	{
		company: "Enam Dua Teknologi",
		position: "Frontend Web Developer",
		type: "remote",
		period: [new Date(2022, 5), new Date(2022, 7)],
		details: [
			"Developed a Task Management System for J99 Corp. Holding similar to Jira using React, React Hook Form, React Query, Typescript, and ChakraUI",
			"Applied Render-as-you-fetch pattern using Suspense to improve the User Experience of the app",
			"Applied Atomic Design in React to make sharing components easier",
			"Collaborate with other frontend and backend developers to build a task management system",
			"Implemented Figma UI design into an interactive React UI",
			"Uses SSE to implement notification feature"
		],
		technologies: [
			"typescript",
			"react",
			"react-hook-form",
			"react-query",
			"chakra-ui",
		]
	}
];