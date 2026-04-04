# Markdown Repository

Use markdown files like a database. Read directories of `.md` or `.mdx` files, query them by frontmatter fields, sort, filter, and limit — with an API modeled after Firestore.

## Installation

```bash
npm install markdown-repository
```

## Quick start

Given a directory of blog posts:

```
posts/
  firebase-cost-optimization.mdx
  why-mvps-fail.mdx
  react-server-components.mdx
```

Each with YAML frontmatter:

```markdown
---
title: Firebase Cost Optimization
date: "2025-08-22"
tags: [firebase, devops]
hidden: false
---

Post content here.
```

Create a repository and query it:

```javascript
import { MarkdownRepository, query, where, orderBy, limit, get } from "markdown-repository";

const posts = new MarkdownRepository("posts", {
  extensions: [".mdx"],
});

// Get all posts
const all = get(posts);

// Get one post by slug (filename without extension)
const post = get(posts, "firebase-cost-optimization");

// Filter by tag
const firebasePosts = get(
  query(posts, where("tags", "array-contains", "firebase"))
);

// Sort by date, newest first, take 5
const recent = get(
  query(posts, orderBy("date", "desc"), limit(5))
);
```

## Repository options

```javascript
const repo = new MarkdownRepository(directory, options);
```

| Option | Type | Default | Description |
|---|---|---|---|
| `extensions` | `string[]` | `[".md"]` | File extensions to include |
| `recursive` | `boolean` | `false` | Traverse subdirectories |
| `validator` | `(item) => item is T` | accepts all | Type guard for content validation |

### MDX files

```javascript
const posts = new MarkdownRepository("content/posts", {
  extensions: [".mdx"],
});
```

### Recursive directories

For content organized in nested folders:

```
content/
  discovery/
    worth-building.mdx
    user-research.mdx
  delivery/
    ship-early.mdx
    incremental-releases.mdx
  discovery.mdx
  delivery.mdx
```

```javascript
const principles = new MarkdownRepository("content", {
  extensions: [".mdx"],
  recursive: true,
});

// Slugs reflect the directory structure
get(principles, "discovery");                // → discovery.mdx
get(principles, "discovery/worth-building"); // → discovery/worth-building.mdx

// Get all — returns flat array with nested slugs
const all = get(principles);
// [
//   { slug: "delivery", title: "Delivery", ... },
//   { slug: "delivery/ship-early", title: "Ship Early", ... },
//   { slug: "discovery", title: "Discovery", ... },
//   { slug: "discovery/user-research", title: "User Research", ... },
//   { slug: "discovery/worth-building", title: "Worth Building", ... },
// ]
```

### Content validation with TypeScript

Define a type guard to get type-safe access to frontmatter fields:

```typescript
interface BlogPost extends MarkdownItem {
  title: string;
  date: string;
  tags: string[];
}

function isBlogPost(item: MarkdownItem): item is BlogPost {
  return (
    typeof item.title === "string" &&
    typeof item.date === "string" &&
    Array.isArray(item.tags)
  );
}

const posts = new MarkdownRepository<BlogPost>("posts", {
  extensions: [".mdx"],
  validator: isBlogPost,
});

// TypeScript knows post.title, post.date, post.tags exist
const post = get(posts, "firebase-cost-optimization");
console.log(post.title);
```

Files that fail validation are silently excluded from `getAll()` results. `getBySlug()` throws `MarkdownRepositoryInvalidTypeError`.

## Query API

The query API follows [Firestore's functional pattern](https://firebase.google.com/docs/firestore/query-data/queries). Constraints are standalone functions that compose via `query()` and execute via `get()`.

### `query(repository, ...constraints)`

Combines a repository with constraints. Returns a query object — no data is read until `get()` is called.

```javascript
const q = query(
  posts,
  where("hidden", "!=", true),
  orderBy("date", "desc"),
  limit(10)
);

const results = get(q);
```

### `get(source, slug?)`

Executes a read. Three overloads:

```javascript
get(posts, "my-slug")  // → single item (T)
get(posts)             // → all items (T[])
get(q)                 // → query results (T[])
```

### `where(field, operator, value)`

Filters items by a frontmatter field. Supports all Firestore comparison operators.

**Equality**

```javascript
where("hidden", "==", true)
where("hidden", "!=", true)
```

**Comparison**

```javascript
where("order", ">", 1)
where("order", ">=", 1)
where("order", "<", 10)
where("order", "<=", 10)
```

**Array membership**

```javascript
// Field is an array, check if it contains a value
where("tags", "array-contains", "firebase")

// Field is an array, check if it contains any of these values
where("tags", "array-contains-any", ["firebase", "devops"])
```

**Value membership**

```javascript
// Field value is one of these
where("status", "in", ["draft", "review"])

// Field value is none of these
where("status", "not-in", ["archived", "deleted"])
```

### `orderBy(field, direction?)`

Sorts results. Direction is `"asc"` (default) or `"desc"`. Multiple `orderBy` constraints are applied in order — first is primary sort, second breaks ties.

```javascript
orderBy("date", "desc")
orderBy("order", "asc")
orderBy("title") // defaults to "asc"
```

### `limit(count)`

Caps the number of returned items. Applied after filtering and sorting.

```javascript
limit(5)
```

## Dynamic query composition

Constraints are plain objects. Build them conditionally, store them in arrays, spread them into `query()`.

```javascript
function getPosts({ tag, sortBy = "date", max } = {}) {
  const constraints = [];

  constraints.push(where("hidden", "!=", true));

  if (tag) {
    constraints.push(where("tags", "array-contains", tag));
  }

  constraints.push(orderBy(sortBy, "desc"));

  if (max) {
    constraints.push(limit(max));
  }

  return get(query(posts, ...constraints));
}

// All posts, newest first
getPosts();

// Firebase posts, 5 max
getPosts({ tag: "firebase", max: 5 });
```

## Real-world examples

### Blog with scheduled publishing

Posts have a `date` field and optional `hidden` flag. A post is published when its date is today or earlier and it's not hidden.

```javascript
import { MarkdownRepository, query, where, get } from "markdown-repository";
import { parse, startOfDay, isBefore, isEqual } from "date-fns";

const posts = new MarkdownRepository("mod/jurij/posts", {
  extensions: [".mdx"],
});

function parseDate(str) {
  return str.includes(" ")
    ? parse(str, "yyyy-MM-dd HH:mm", new Date())
    : parse(str, "yyyy-MM-dd", new Date());
}

function isPublished(post) {
  if (post.hidden || !post.date) return false;
  const postDate = startOfDay(parseDate(post.date));
  const today = startOfDay(new Date());
  return isBefore(postDate, today) || isEqual(postDate, today);
}

// All published posts, newest first
function getAllPosts() {
  return get(posts)
    .filter(isPublished)
    .sort((a, b) => (parseDate(a.date) < parseDate(b.date) ? 1 : -1));
}

// Posts with a specific tag
function getPostsByTag(tag) {
  return get(
    query(posts, where("tags", "array-contains", tag))
  ).filter(isPublished)
    .sort((a, b) => (parseDate(a.date) < parseDate(b.date) ? 1 : -1));
}

// Tag cloud with counts
function getAllTags() {
  const tagMap = {};
  for (const post of getAllPosts()) {
    for (const tag of post.tags || []) {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    }
  }
  return Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}
```

### Nested content with categories

A principles handbook organized by category, with ordered pages inside each category.

```
content/
  discovery.mdx            # category parent
  discovery/
    worth-building.mdx     # order: 1
    user-research.mdx      # order: 2
  delivery.mdx
  delivery/
    ship-early.mdx
    incremental-releases.mdx
```

```javascript
import { MarkdownRepository, query, where, orderBy, get } from "markdown-repository";

const principles = new MarkdownRepository("mod/principles/content", {
  extensions: [".mdx"],
  recursive: true,
});

// All principles as a flat list
function getAllPrinciples() {
  return get(principles);
}

// Single principle by path — accepts string or array
function getPrincipleBySlug(slug) {
  const slugString = Array.isArray(slug) ? slug.join("/") : slug;
  return get(principles, slugString);
}

// All slugs as path arrays (for Next.js generateStaticParams)
function getAllSlugs() {
  return get(principles).map((p) => p.slug.split("/"));
}

// Children of a category, sorted by order
function getCategoryChildren(category) {
  return get(
    query(
      principles,
      where("slug", "!=", category),
      orderBy("order", "asc")
    )
  ).filter((p) => p.slug.startsWith(category + "/"));
}
```

### Next.js App Router integration

```javascript
// app/blog/[slug]/page.js
import { posts } from "@/lib/posts";
import { get } from "markdown-repository";

export async function generateStaticParams() {
  return get(posts).map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = get(posts, slug);

  return <article>{/* render post */}</article>;
}
```

```javascript
// app/blog/[slug]/page.js (catch-all for nested slugs)
import { principles } from "@/lib/principles";
import { get } from "markdown-repository";

export async function generateStaticParams() {
  return get(principles).map((p) => ({
    slug: p.slug.split("/"),
  }));
}

export default async function PrinciplePage({ params }) {
  const { slug } = await params;
  const post = get(principles, slug.join("/"));

  return <article>{/* render principle */}</article>;
}
```

## MarkdownItem shape

Every item returned by `get()` has this base shape:

```typescript
interface MarkdownItem {
  slug: string;    // derived from filename (without extension)
  content: string; // markdown body (everything after frontmatter)
  excerpt: string; // auto-extracted excerpt
  [key: string]: any; // all frontmatter fields spread here
}
```

The `slug` for flat directories is the filename: `my-post.mdx` becomes `"my-post"`. For recursive directories, it includes the path: `discovery/worth-building.mdx` becomes `"discovery/worth-building"`.

## Error handling

```javascript
import {
  MarkdownRepositoryNotFoundError,
  MarkdownRepositoryInvalidTypeError,
} from "markdown-repository";

try {
  const post = get(posts, "nonexistent-slug");
} catch (error) {
  if (error instanceof MarkdownRepositoryNotFoundError) {
    // File doesn't exist
  }
  if (error instanceof MarkdownRepositoryInvalidTypeError) {
    // File exists but fails validator
  }
}
```

## License

MIT