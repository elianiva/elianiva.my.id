# elianiva.my.id

Personal website built with Astro 5, Svelte 5, and Tailwind CSS 4.

## Commands

```bash
# Development
bun dev              # Start dev server

# Build
bun run build        # Production build (outputs to ./dist)
bun run preview      # Preview production build locally

# Code Quality
bun run check        # Biome lint/format check and auto-fix
bunx knip            # Check for unused dependencies/exports
```

## Project Structure

- `src/pages/` - Astro pages (file-based routing)
- `src/components/` - Svelte/Astro components
- `src/layouts/` - Astro layout templates
- `src/content/` - Content collections (posts, projects, bookmarks)
- `src/data/` - Data fetching utilities
- `src/models/` - Domain models/type definitions
- `src/types/` - Shared TypeScript types

## Conventions

### Imports
- Use `~/*` path alias for all src imports
- Import icons as `~icons/ph/<icon-name>` (Phosphor icons)
- Group imports: external libs → internal modules → types
- Biome auto-organizes imports on save/lint

### TypeScript
- Strict mode enabled (extends `astro/tsconfigs/strictest`)
- Prefer explicit types for function params and returns
- Use type guards for runtime validation (see `raindrop.ts`)
- Types go in `src/types/` (API responses) or `src/models/` (domain)

### Svelte Components
- Use Svelte 5 runes: `$props`, `$state`, `$derived`
- Add `// biome-ignore lint/style/useConst: this is a ref` for DOM refs
- Components use `<script lang="ts">` (no style blocks typically)
- Accessibility: include `aria-label`, `role`, proper keyboard handling

### Styling
- Tailwind CSS v4 with `@theme` for custom fonts
- Color palette: `pink-*` variants (rose-pine inspired)
- Border style: `border-dashed` is the site signature
- Typography via `@tailwindcss/typography` with custom prose overrides

### Content Collections
- Defined in `src/content/config.ts` with Zod schemas
- Collections: `posts`, `projects`, `bookmarks`, `github`
- GitHub PRs loaded via custom loader (`src/content/loaders/github.ts`)

### Environment Variables
- Defined in `astro.config.mjs` env schema
- Server-only secrets: `RAINDROP_API_KEY`, `GH_TOKEN`
- Access via `astro:env/server`

## Notes
- Uses Bun as package manager (see `bun.lock`)
- Deployed to Cloudflare Pages
- OG images generated via Satori in `src/pages/api/og-image.ts`
- Motion animations via `motion` library with reduced-motion support
