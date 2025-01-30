# Markdown Repository

A TypeScript library for managing and retrieving markdown files with frontmatter support. This package provides a simple and type-safe way to work with markdown content in your Node.js applications.

## Features

- 📝 Read markdown files with frontmatter
- 🔍 Get single posts by slug
- 📚 Get all posts from a directory
- 🔒 Type-safe content validation
- 📑 Automatic excerpt extraction
- 🎯 Custom content type support

## Installation

```bash
npm install markdown-repository 
```
 
## Basic Usage

```typescript
import { MarkdownRepository } from 'markdown-repository';

// Create a repository instance pointing to your markdown files
const repository = new MarkdownRepository('content');

// Get all markdown posts
const posts = repository.getAll();

// Get a specific post by slug
const post = repository.getBySlug('hello-world');
```


## Custom Content Types

You can define custom content types with TypeScript for type-safe markdown content:

```typescript
interface BlogPost extends MarkdownItem {
  title: string;
  date: string;
  author: string;
}

function isValidBlogPost(item: MarkdownItem): item is BlogPost {
  return (
    typeof item.title === 'string' &&
    typeof item.date === 'string' &&
    typeof item.author === 'string'
  );
}

const blogRepository = new MarkdownRepository<BlogPost>('posts', isValidBlogPost);

// Now TypeScript knows the exact shape of your posts
const post = blogRepository.getBySlug('hello-world');

// TypeScript knows this exists
console.log(post.title); 
```

## Markdown File Structure

Your markdown files should be structured with frontmatter at the top:

```markdown
---
title: Hello World
date: 2024-03-21
author: John Doe
---
This is the content of the post.
```


## API Reference

### `MarkdownRepository<T extends MarkdownItem>`

#### Constructor

```typescript
constructor(
  directory: string, 
  validator?: (item: MarkdownItem) => item is T
)
```

- `directory`: The path to your markdown files relative to the project root
- `validator`: Optional type guard function for custom content validation

#### Methods

##### `getBySlug(slug: string): T`

Retrieves a single markdown item by its slug. Throws `MarkdownRepositoryNotFoundError` if the file doesn't exist or `MarkdownRepositoryInvalidTypeError` if the content doesn't match the expected type.

##### `getAll(): T[]`

Retrieves all valid markdown items from the directory.

### Interfaces

#### `MarkdownItem`

```typescript
interface MarkdownItem {
  slug: string;
  content: string;
  excerpt: string;
  [key: string]: string | number | Date | Record<string, Value> | Array<Record<string, Value>>;
}
```

## Error Handling

The package provides two custom error types:

- `MarkdownRepositoryNotFoundError`: Thrown when a requested file doesn't exist
- `MarkdownRepositoryInvalidTypeError`: Thrown when content doesn't match the expected type

```typescript
try {
  const post = repository.getBySlug('non-existent');
} catch (error) {
  if (error instanceof MarkdownRepositoryNotFoundError) {
    console.error('Post not found');
  }
}
```