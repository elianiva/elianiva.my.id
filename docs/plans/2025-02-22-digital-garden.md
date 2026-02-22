# Digital Garden Implementation Plan

> **IMPORTANT**: Use plan-execute skill to implement this plan task-by-task.

**Goal:** Build a digital garden at `/notes` that loads content from `~/Development/personal/notes` with wiki-links, backlinks, search, and graph visualization.

**Architecture:** Custom Astro Content Layer loader reads from external notes directory, filters by `public` tag, parses wiki-links for backlink index. Client-side search with fuse.js, graph visualization with force-graph.

**Tech Stack:** Astro 5 Content Layer API, gray-matter, remark wiki-link plugin, fuse.js, force-graph (or d3-force)

---

## Phase 1: Foundation - Loader & Schema

### Task 1.1: Install dependencies
```bash
bun add gray-matter fuse.js force-graph
bun add -D @types/mdast
```

### Task 1.2: Create notes loader
**File:** `src/content/loaders/notes.ts`
- Create loader that reads from `~/Development/personal/notes`
- Include glob patterns: `Articles/**/*.md`, `Vault/**/*.md` (excluding Archive/), `Music/*.md`, `People/*.md`
- Exclude: `Daily/`, `Inbox/`, `Archive/` directories
- Parse frontmatter with gray-matter
- Filter: only include if `tags` includes "public"
- Generate slug from file path (remove .md, lowercase, hyphenate)
- Extract title from H1 or frontmatter `id`
- Store content for later rendering
- Return entries with schema matching Note interface

### Task 1.3: Define notes collection schema
**File:** `src/content/config.ts`
- Add `notes` collection with loader referencing notes.ts
- Define Zod schema matching Note interface
- Remove `bookmarks` collection (will be replaced)

### Task 1.4: Test loader
- Run `bun dev` and verify loader runs without errors
- Check console for loaded notes count
- Verify only public-tagged notes are included

---

## Phase 2: Basic Pages - Index & Detail

### Task 2.1: Create note list/index page
**File:** `src/pages/notes/index.astro`
- Query all notes using `getCollection('notes')`
- Group by category (Articles, Vault, People, Music)
- Display simple list with title, date, tags
- Link to individual note pages

### Task 2.2: Create note detail page
**File:** `src/pages/notes/[slug].astro`
- Dynamic route using `getStaticPaths`
- Render note content as markdown
- Display metadata: title, category, tags, dates
- Link back to index

### Task 2.3: Create NoteLayout
**File:** `src/layouts/NoteLayout.astro`
- Based on MainLayout but more minimal
- Garden-specific styling (subdued colors)
- Breadcrumb navigation

### Task 2.4: Remove bookmarks
- Delete `src/content/bookmarks/` directory
- Delete `src/pages/bookmarks.astro`
- Remove bookmarks collection from config.ts
- Remove raindrop data fetching if unused elsewhere

---

## Phase 3: Wiki-Links & Backlinks

### Task 3.1: Create wiki-link remark plugin
**File:** `src/plugins/wiki-links.ts`
- Parse `[[Note Title]]` and `[[Note Title|Display]]` syntax
- Convert to markdown links: `[Display](/notes/slug)`
- Extract link targets for backlink index
- Handle slug conversion (lowercase, hyphenate)

### Task 3.2: Build backlink index
**File:** `src/lib/backlinks.ts`
- Function to build bidirectional link map
- Input: all notes with parsed outgoing links
- Output: Map<noteId, incomingLinkIds[]>
- Store as virtual collection or build-time data

### Task 3.3: Add backlinks to note pages
**File:** `src/components/notes/Backlinks.astro`
- Component showing "Linked from" section
- List notes that link to current note
- Show excerpt or context around the link

### Task 3.4: Integrate wiki-link rendering
- Update note detail page to use remark plugin
- Ensure wiki-links render as proper anchor tags
- Style wiki-links distinctly (dashed underline?)

---

## Phase 4: Search & Filtering

### Task 4.1: Create search index
**File:** `src/lib/search.ts`
- Build search index from all notes at build time
- Index fields: title, content, tags
- Create JSON endpoint: `/api/search.json`

### Task 4.2: Create Search component
**File:** `src/components/notes/Search.svelte`
- Client-side search input
- Use fuse.js for fuzzy search
- Show results dropdown or filtered list
- Highlight matching terms

### Task 4.3: Create TagFilter component
**File:** `src/components/notes/TagFilter.astro`
- Extract all unique tags from notes
- Display as clickable tag pills
- Filter notes by selected tags

### Task 4.4: Enhance index page
- Add search component to `/notes` page
- Add category tabs (All, Articles, Vault, People, Music)
- Add tag filtering
- Show note count per category

---

## Phase 5: Graph Visualization

### Task 5.1: Generate graph data
**File:** `src/lib/graph.ts`
- Build nodes: all notes with id, title, category, tags
- Build edges: from outgoing_links in each note
- Create JSON endpoint: `/api/graph.json`

### Task 5.2: Create GraphView component
**File:** `src/components/notes/GraphView.svelte`
- Use force-graph for 2D force-directed graph
- Color nodes by category
- Click to navigate to note
- Hover to show title
- Zoom and pan controls

### Task 5.3: Add graph to index page
- Display mini graph on `/notes` page
- Option to expand to full view
- Filter graph by selected category/tags

---

## Phase 6: Polish & Styling

### Task 6.1: Create NoteCard component
**File:** `src/components/notes/NoteCard.astro`
- Preview card for note list
- Title, excerpt, tags, date, category badge
- Hover effects

### Task 6.2: Style wiki-links
- Dashed underline or distinct color
- Tooltip on hover showing target preview
- Different style for broken links

### Task 6.3: Style backlinks section
- Clean list with note titles
- Show relationship context
- Link to source notes

### Task 6.4: Responsive design
- Mobile: stack layout, smaller graph
- Tablet: 2-column grid
- Desktop: 3-column grid, full graph

### Task 6.5: Empty states
- No notes in category
- No search results
- No backlinks yet

---

## Phase 7: Migration & Cleanup

### Task 7.1: Create redirects
**File:** `src/pages/bookmarks.astro` (modified)
- Return redirect to `/notes`
- Or delete and handle at CDN level

### Task 7.2: Update navigation
**File:** `src/components/Navigation.astro` or similar
- Change Bookmarks link to Garden/Notes
- Update label and icon

### Task 7.3: Remove unused code
- Delete `src/data/raindrop.ts` if unused
- Remove bookmark-related types
- Clean up any orphaned utilities

### Task 7.4: Final testing
- Verify all public notes load
- Test wiki-links between notes
- Test search functionality
- Test graph visualization
- Test mobile responsiveness
- Run `bun run check` for linting

---

## Checkpoints

1. **After Phase 1:** Loader works, notes appear in collection
2. **After Phase 2:** Can browse all notes, basic navigation works
3. **After Phase 3:** Wiki-links render, backlinks show correctly
4. **After Phase 4:** Search and filtering work client-side
5. **After Phase 5:** Graph visualization displays and is interactive
6. **After Phase 6:** Design polished, mobile-friendly
7. **After Phase 7:** Bookmarks redirected, site builds successfully

---

## Notes & Context

### From Design Plan
- Notes directory: `~/Development/personal/notes`
- Public filter: `tags` includes "public"
- Categories: article, vault, person, music
- URL: `/notes/[slug]` (flat structure)
- Images: external/CDN only
- Daily notes: excluded completely

### Existing Code References
- `src/content/loaders/github.ts` - Reference for loader pattern
- `src/content/config.ts` - Collection definitions
- `src/layouts/MainLayout.astro` - Base layout to extend

### Potential Issues
- File path resolution from external notes directory
- Wiki-link slug matching (case sensitivity)
- Performance with large note count (consider pagination)
