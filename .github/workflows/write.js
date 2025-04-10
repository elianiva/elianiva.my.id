module.exports = async ({ github, context, core, require }) => {
	const fs = require("node:fs");
	const path = require("node:path");

	const issue = await github.rest.issues.get({
		issue_number: context.issue.number,
		owner: context.repo.owner,
		repo: context.repo.repo,
	});
	if (!issue) {
		core.setFailed("Could not get issue details from github.event");
		return;
	}

	const date = new Date().toISOString().split("T")[0];
	const title = issue.title;
	const body = issue.body || "";
	const type = issue.labels?.find((label) => label.name.startsWith("type:"))?.name.split(":")[1] || "";

	if (body.length === 0) {
		core.setFailed("Issue body is empty");
		return;
	}

	if (type.length === 0) {
		core.setFailed("Issue labels do not contain a type");
		return;
	}

	const [content, links] = body.split("---").map((part) => part.trim());
	const linksArray = links.split("\n").map((link) => link.trim());
	const markdown = `---
title: ${title}
date: ${date}
type: ${type}
${linksArray.length > 0 ? `links:
${linksArray.map((link) => `    - url: ${link}`).join("\n")}` : ""}
---

${content}`;

	const snakeCasedTitle = title.toLowerCase().replace(/ /g, "-");
	const filePath = path.join(
		__dirname,
		"..",
		"src",
		"content",
		"bookmarks",
		`${snakeCasedTitle}.mdx`,
	);
	fs.writeFileSync(filePath, markdown);

	console.log(`Successfully created TIL file: ${filePath}`);
};
