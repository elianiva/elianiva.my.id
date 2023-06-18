declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	interface Render {
		'.md': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type CollectionEntry<C extends keyof AnyEntryMap> = AnyEntryMap[C][keyof AnyEntryMap[C]];

	// TODO: Remove this when having this fallback is no longer relevant. 2.3? 3.0? - erika, 2023-04-04
	/**
	 * @deprecated
	 * `astro:content` no longer provide `image()`.
	 *
	 * Please use it through `schema`, like such:
	 * ```ts
	 * import { defineCollection, z } from "astro:content";
	 *
	 * defineCollection({
	 *   schema: ({ image }) =>
	 *     z.object({
	 *       image: image(),
	 *     }),
	 * });
	 * ```
	 */
	export const image: never;

	// This needs to be in sync with ImageMetadata
	export type ImageFunction = () => import('astro/zod').ZodObject<{
		src: import('astro/zod').ZodString;
		width: import('astro/zod').ZodNumber;
		height: import('astro/zod').ZodNumber;
		format: import('astro/zod').ZodUnion<
			[
				import('astro/zod').ZodLiteral<'png'>,
				import('astro/zod').ZodLiteral<'jpg'>,
				import('astro/zod').ZodLiteral<'jpeg'>,
				import('astro/zod').ZodLiteral<'tiff'>,
				import('astro/zod').ZodLiteral<'webp'>,
				import('astro/zod').ZodLiteral<'gif'>,
				import('astro/zod').ZodLiteral<'svg'>
			]
		>;
	}>;

	type BaseSchemaWithoutEffects =
		| import('astro/zod').AnyZodObject
		| import('astro/zod').ZodUnion<import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodDiscriminatedUnion<string, import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodIntersection<
				import('astro/zod').AnyZodObject,
				import('astro/zod').AnyZodObject
		  >;

	type BaseSchema =
		| BaseSchemaWithoutEffects
		| import('astro/zod').ZodEffects<BaseSchemaWithoutEffects>;

	export type SchemaContext = { image: ImageFunction };

	type DataCollectionConfig<S extends BaseSchema> = {
		type: 'data';
		schema?: S | ((context: SchemaContext) => S);
	};

	type ContentCollectionConfig<S extends BaseSchema> = {
		type?: 'content';
		schema?: S | ((context: SchemaContext) => S);
	};

	type CollectionConfig<S> = ContentCollectionConfig<S> | DataCollectionConfig<S>;

	export function defineCollection<S extends BaseSchema>(
		input: CollectionConfig<S>
	): CollectionConfig<S>;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {})
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {})
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {})
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {})
	>(
		collection: C,
		slug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {})
	>(
		collection: C,
		id: E
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[]
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[]
	): Promise<CollectionEntry<C>[]>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
			  }
			: {
					collection: C;
					id: keyof DataEntryMap[C];
			  }
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"posts": {
"2bwm.mdx": {
	id: "2bwm.mdx";
  slug: "2bwm";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"a-year-of-japanese.mdx": {
	id: "a-year-of-japanese.mdx";
  slug: "a-year-of-japanese";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"chrome-custom-newtab.mdx": {
	id: "chrome-custom-newtab.mdx";
  slug: "chrome-custom-newtab";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"combining-adonis-and-svelte-using-inertia.mdx": {
	id: "combining-adonis-and-svelte-using-inertia.mdx";
  slug: "combining-adonis-and-svelte-using-inertia";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"comments-widget-using-utterance.mdx": {
	id: "comments-widget-using-utterance.mdx";
  slug: "comments-widget-using-utterance";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"defx-nvim.mdx": {
	id: "defx-nvim.mdx";
  slug: "defx-nvim";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"es6-array-methods.mdx": {
	id: "es6-array-methods.mdx";
  slug: "es6-array-methods";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"from-sapper-to-kit.mdx": {
	id: "from-sapper-to-kit.mdx";
  slug: "from-sapper-to-kit";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"github-actions.mdx": {
	id: "github-actions.mdx";
  slug: "github-actions";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"how-i-memorise-heijitsu.mdx": {
	id: "how-i-memorise-heijitsu.mdx";
  slug: "how-i-memorise-heijitsu";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"how-i-use-latex-as-a-uni-student.mdx": {
	id: "how-i-use-latex-as-a-uni-student.mdx";
  slug: "how-i-use-latex-as-a-uni-student";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"i-rebuilt-my-site-using-sapper.mdx": {
	id: "i-rebuilt-my-site-using-sapper.mdx";
  slug: "i-rebuilt-my-site-using-sapper";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"japanese-fts-using-sqlite.mdx": {
	id: "japanese-fts-using-sqlite.mdx";
  slug: "japanese-fts-using-sqlite";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"japanese-input-method-on-linux.mdx": {
	id: "japanese-input-method-on-linux.mdx";
  slug: "japanese-input-method-on-linux";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"making-of-my-site-2.mdx": {
	id: "making-of-my-site-2.mdx";
  slug: "making-of-my-site-2";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"making-of-my-site-3.mdx": {
	id: "making-of-my-site-3.mdx";
  slug: "making-of-my-site-3";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"making-of-my-site.mdx": {
	id: "making-of-my-site.mdx";
  slug: "making-of-my-site";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"my-experience-with-svelte.mdx": {
	id: "my-experience-with-svelte.mdx";
  slug: "my-experience-with-svelte";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"my-nvim-lsp-setup.mdx": {
	id: "my-nvim-lsp-setup.mdx";
  slug: "my-nvim-lsp-setup";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"my-opinion-on-nix.mdx": {
	id: "my-opinion-on-nix.mdx";
  slug: "my-opinion-on-nix";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"my-spotify-tui-setup.mdx": {
	id: "my-spotify-tui-setup.mdx";
  slug: "my-spotify-tui-setup";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"my-suckless-setup.mdx": {
	id: "my-suckless-setup.mdx";
  slug: "my-suckless-setup";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"neovim-lua-statusline.mdx": {
	id: "neovim-lua-statusline.mdx";
  slug: "neovim-lua-statusline";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"path-alias-in-javascript-and-typescript.mdx": {
	id: "path-alias-in-javascript-and-typescript.mdx";
  slug: "path-alias-in-javascript-and-typescript";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"prettify-screenshot-using-imagemagick.mdx": {
	id: "prettify-screenshot-using-imagemagick.mdx";
  slug: "prettify-screenshot-using-imagemagick";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"rest-client-for-vim.mdx": {
	id: "rest-client-for-vim.mdx";
  slug: "rest-client-for-vim";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"site-redesign.mdx": {
	id: "site-redesign.mdx";
  slug: "site-redesign";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"thinkpad-x220.mdx": {
	id: "thinkpad-x220.mdx";
  slug: "thinkpad-x220";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"trying-out-sveltekit.mdx": {
	id: "trying-out-sveltekit.mdx";
  slug: "trying-out-sveltekit";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"vim-statusline.mdx": {
	id: "vim-statusline.mdx";
  slug: "vim-statusline";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"why-i-use-linux.mdx": {
	id: "why-i-use-linux.mdx";
  slug: "why-i-use-linux";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
};
"projects": {
"brainly-scraper-ts.mdx": {
	id: "brainly-scraper-ts.mdx";
  slug: "brainly-scraper-ts";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"ci-inventory-app.mdx": {
	id: "ci-inventory-app.mdx";
  slug: "ci-inventory-app";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"covid-info-v2.mdx": {
	id: "covid-info-v2.mdx";
  slug: "covid-info-v2";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"covid-info.mdx": {
	id: "covid-info.mdx";
  slug: "covid-info";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"gh-job.mdx": {
	id: "gh-job.mdx";
  slug: "gh-job";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"graphene.mdx": {
	id: "graphene.mdx";
  slug: "graphene";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"java-cashier-app.mdx": {
	id: "java-cashier-app.mdx";
  slug: "java-cashier-app";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"jisho-lens.mdx": {
	id: "jisho-lens.mdx";
  slug: "jisho-lens";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"kana-board.mdx": {
	id: "kana-board.mdx";
  slug: "kana-board";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"kanaizu.mdx": {
	id: "kanaizu.mdx";
  slug: "kanaizu";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"nyaa-si-scraper.mdx": {
	id: "nyaa-si-scraper.mdx";
  slug: "nyaa-si-scraper";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"old-personal-site.mdx": {
	id: "old-personal-site.mdx";
  slug: "old-personal-site";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"online-library.mdx": {
	id: "online-library.mdx";
  slug: "online-library";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"p.mdx": {
	id: "p.mdx";
  slug: "p";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"prawf.mdx": {
	id: "prawf.mdx";
  slug: "prawf";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"school-stuff.mdx": {
	id: "school-stuff.mdx";
  slug: "school-stuff";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"skaga.mdx": {
	id: "skaga.mdx";
  slug: "skaga";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"svelteception.mdx": {
	id: "svelteception.mdx";
  slug: "svelteception";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"umaru-chat.mdx": {
	id: "umaru-chat.mdx";
  slug: "umaru-chat";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	type ContentConfig = typeof import("../src/content/config");
}
