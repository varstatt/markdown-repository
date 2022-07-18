import fs from "fs";
import path from "path";

import matter from "gray-matter";

export class MarkdownRepositoryNotFoundError extends Error { }

export class MarkdownRepositoryInvalidTypeError extends Error { }

type Value = string | number | Date;

export interface MarkdownItem {
  slug: string
  content: string
  excerpt: string
  [key: string]: Value | Record<string, Value> | Array<Record<string, Value>>
}

const MARKDOWN_EXTENSION = ".md";
const FILE_CHARSET = "utf8";

function defaultValidator<T extends MarkdownItem = MarkdownItem> (item: MarkdownItem): item is T {
  return typeof item.slug === "string" && typeof item.content === "string" && typeof item.excerpt === "string";
}

export class MarkdownRepository<T extends MarkdownItem = MarkdownItem> {
  constructor (
    protected directory: string,
    protected validator: (item: MarkdownItem) => item is T = defaultValidator
  ) { }

  private getDirectoryPath (): string {
    return path.join(process.cwd(), this.directory);
  }

  private getFileNameBySlug (slug: string): string {
    return `${slug}${MARKDOWN_EXTENSION}`;
  }

  private isMarkdownFile (fileName: string): boolean {
    return fileName.endsWith(MARKDOWN_EXTENSION);
  }

  private getSlugByFileName (fileName: string): string {
    return fileName.replace(MARKDOWN_EXTENSION, "");
  }

  private readFile (fileName: string): string {
    return fs.readFileSync(path.join(this.getDirectoryPath(), fileName), FILE_CHARSET);
  }

  private readDirectoryFileNames (): string[] {
    return fs.readdirSync(this.getDirectoryPath());
  }

  private parseMarkdown (fileContents: string): matter.GrayMatterFile<string> {
    return matter(fileContents, {
      excerpt: true
    });
  }

  private readFileBySlug (slug: string): string {
    try {
      return this.readFile(this.getFileNameBySlug(slug));
    } catch (e) {
      throw new MarkdownRepositoryNotFoundError(slug);
    }
  }

  private getDirectorySlugs (): string[] {
    return this.readDirectoryFileNames().filter(this.isMarkdownFile).map(this.getSlugByFileName);
  }

  private getRawPost (slug: string): MarkdownItem {
    const content = this.readFileBySlug(slug);
    const parsed = this.parseMarkdown(content);

    return {
      slug,
      content: parsed.content,
      excerpt: parsed.excerpt ?? "",
      ...parsed.data
    };
  }

  private getRawPosts (): MarkdownItem[] {
    const slugs = this.getDirectorySlugs();
    const getter = this.getRawPost.bind(this);

    return slugs.map(getter);
  }

  getBySlug (slug: string): T {
    const raw = this.getRawPost(slug);

    if (this.validator(raw)) {
      return raw;
    }

    throw new MarkdownRepositoryInvalidTypeError(slug);
  }

  getAll (): T[] {
    return this.getRawPosts().filter(this.validator);
  }
}
