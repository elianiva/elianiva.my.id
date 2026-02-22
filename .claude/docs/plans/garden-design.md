# Digital Garden Design Plan

## Problem Statement
Create a digital garden/content vault that pulls from `~/Development/personal/notes` and publishes only `#public` tagged content, replacing the existing bookmarks system on elianiva.my.id.

## Goals
- Minimal, vault-ish design aesthetic (distinct from main site's colorful style)
- Load content from external notes directory via custom Astro loader
- Support categories: Articles, People, Music, Vault (knowledge base)
- Tag-based filtering and navigation
- (Future) Wiki-links and backlink support

## Current Context
- Notes directory has: Articles/, Vault/, Music/, People/, Daily/, Inbox/, Templates/
- Existing bookmarks use Raindrop API + local MDX files
- Site uses Astro 5 with Content Layer API
- Already has custom GitHub loader as reference

## Known Requirements
- Filter: Only include notes with `public` tag
- Exclude: Daily/, Inbox/, Archive/ directories
- Include: Articles/**/*.md, Vault/**/*.md, Music/*.md, People/*.md


## Decisions Made

### URL Structure
- **Primary:** `notes.elianiva.my.id` (subdomain)
- **Redirect:** `elianiva.my.id/notes/*` → `notes.elianiva.my.id/*`
- **Note paths:** `/notes/[category]/[slug]` or `/notes/[slug]`

### Design Aesthetic
- Match existing site (pink/yellow accents) but more subdued/minimal
- Keep the dashed borders signature
- Cleaner, more vault-like presentation

### Bookmark Migration
- **Replace entirely** - delete existing bookmarks system
- Garden takes over with fresh content from notes directory

### Launch Scope
- **Full garden:** List, tags, search, wiki-links, backlink graph
- All features from the start

## Design Exploration

### Content Categories
Based on notes directory structure:

1. **Articles** - Book summaries, article notes
   - Source: `notes/Articles/**/*.md`
   - Frontmatter: `tags`, `created_at`, `url` (for external source)
   
2. **Vault** - Knowledge base notes
   - Source: `notes/Vault/**/*.md` (excluding Archive/)
   - Frontmatter: `tags`, `created_at`, `aliases`, `id`
   
3. **People** - Profiles of interesting people
   - Source: `notes/People/*.md`
   - Frontmatter: `tags`, `created_at`, `name`, `links`
   
4. **Music** - Album reviews, listening notes
   - Source: `notes/Music/*.md`
   - Frontmatter: `tags`, `listened`, `artist`, `album`, `year`, `rating`

### Unified Schema
All notes share:
- `title` (string) - from H1 or frontmatter
- `slug` (string) - generated from file path
- `category` (enum) - articles | vault | people | music
- `tags` (string[]) - always includes "public" for published
- `created_at` (date) - from frontmatter
- `modified_at` (date) - file mtime
- `content` (string) - raw markdown
- `public` (boolean) - must be true to include

### Wiki-Link Syntax
- `[[Note Title]]` → link to note by title
- `[[Note Title|Display Text]]` → custom display text
- Slug conversion: lowercase, hyphenated, special chars removed

### Backlink Index
Build at build time:
1. Parse all `[[...]]` links from content
2. Map target title → array of source notes
3. Store in virtual collection or build-time data

### Graph Data Structure
```typescript
interface GraphNode {
  id: string;      // note slug
  title: string;   // display title
  category: string;
  tags: string[];
}

interface GraphEdge {
  source: string;  // from slug
  target: string;  // to slug
}
```

### Page Structure

#### Index Page (`/notes`)
- Header with title "Digital Garden / Notes"
- Category tabs/filter: All | Articles | Vault | People | Music
- Tag cloud/filter
- Search input (fuse.js)
- Grid/list of note cards
- Optional: Mini graph visualization

#### Note Page (`/notes/[category]/[slug]` or `/notes/[slug]`)
- Breadcrumb navigation
- Title + metadata (date, tags, category)
- Rendered markdown content
- Wiki-link rendering
- "Linked from" backlinks section
- Related notes (by tags)

### Design Details

#### Color Palette (Subdued from main site)
- Background: `pink-50` or white
- Text: `pink-950`
- Accents: `pink-500`, `yellow-300`, `sky-300` (more muted)
- Borders: `border-dashed border-pink-200` (signature style)

#### Typography
- Display: Keep existing display font
- Body: Keep existing body font
- Mono: For dates, tags, metadata

#### Components
- Note cards: Clean, minimal, dashed borders
- Tags: Pill-shaped, muted colors
- Wiki-links: Special styling (maybe dashed underline)
- Backlinks: List with context snippets

### Technical Implementation

#### Loader (`src/content/loaders/notes.ts`)
Similar pattern to github.ts:
1. Scan directories using glob
2. Read file contents
3. Parse frontmatter (gray-matter)
4. Filter by `public` tag
5. Generate slug from path
6. Extract wiki-links from content
7. Store in content layer

#### Wiki-Link Plugin (`src/plugins/wiki-links.ts`)
Remark plugin:
1. Find `[[...]]` patterns
2. Convert to markdown links
3. Build backlink index

#### Graph Data Generation
Build-time script:
1. Load all notes
2. Extract links
3. Generate nodes/edges JSON
4. Expose via API endpoint or inline

### Decisions Summary

1. **URL Structure:** Flat - `/notes/observability` (category shown in UI, not URL)
2. **Embeds:** No - links only (`[[Note]]` supported, `![[embed]]` not)
3. **Images:** External/CDN only - no local image processing
4. **Daily notes:** Exclude completely - private only
5. **Descriptions:** Auto-generate from first paragraph if not in frontmatter

### Final Schema
```typescript
interface Note {
  // Core
  id: string;              // slugified title/path
  title: string;           // from H1 or frontmatter
  slug: string;            // URL-friendly id
  category: 'article' | 'vault' | 'person' | 'music';
  
  // Metadata
  tags: string[];          // must include 'public'
  created_at: Date;
  modified_at: Date;       // file mtime
  
  // Content
  content: string;         // raw markdown
  html: string;            // rendered HTML
  description?: string;    // excerpt or frontmatter
  
  // Type-specific (optional)
  url?: string;            // articles - source URL
  author?: string;         // articles
  name?: string;           // people - full name
  links?: string[];        // people - external links
  artist?: string;         // music
  album?: string;          // music
  year?: number;           // music
  rating?: number;         // music 1-5
  
  // Computed
  backlinks: string[];     // ids of notes linking to this
  outgoing_links: string[]; // ids this note links to
}
```

### File Structure (High-Level)
```
src/
├── content/
│   ├── config.ts              # Add notes collection
│   └── loaders/
│       └── notes.ts           # Main loader
├── plugins/
│   └── wiki-links.ts          # Remark plugin
├── lib/
│   ├── notes.ts               # Note utilities
│   └── graph.ts               # Graph data builder
├── components/
│   ├── notes/
│   │   ├── NoteCard.astro
│   │   ├── NoteList.astro
│   │   ├── TagFilter.astro
│   │   ├── Backlinks.astro
│   │   ├── GraphView.svelte   # Interactive graph
│   │   └── Search.svelte      # Fuse.js search
│   └── wiki-link/
│       └── WikiLink.astro
├── layouts/
│   └── NoteLayout.astro
└── pages/
    ├── notes/
    │   ├── index.astro        # Garden index
    │   └── [slug].astro       # Individual note
    └── bookmarks.astro        # REMOVE (redirect to /notes)
```

### Routes
- `GET /notes` - Garden index (list + search + tags)
- `GET /notes/[slug]` - Individual note with backlinks
- `GET /api/graph.json` - Graph data for visualization

### Success Metrics

- All public notes from notes directory are accessible
- Wiki-links render correctly and are clickable
- Backlinks show on each note
- Graph visualization displays note relationships
- Search finds notes by title, content, and tags
- Mobile-responsive design
- Fast page loads (< 100kb initial JS)
