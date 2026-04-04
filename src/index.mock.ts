import fs from "node:fs";
import path from "node:path";

// --- Flat .md directory (original fixtures) ---

export const MOCK_DIRECTORY = "mock";

export enum MockSlug {
  NO_FILE = "no-file",
  NO_EXTENSION = "no-extension",
  VALID_1 = "valid-1",
  VALID_2 = "valid-2",
  INVALID_FOR_CUSTOM = "invalid-for-custom",
}

export enum MockContent {
  VALID_1 = "This is mocked content",
  VALID_2 = "This is second mocked content",
  INVALID_FOR_CUSTOM = "This is content without data",
}

export enum MockMarkdown {
  VALID_1 = '---\ntitle: Mock Title 1\ndate: "2024-01-15"\ntags:\n  - typescript\n  - testing\norder: 2\n---\nThis is mocked content',
  VALID_2 = '---\ntitle: Mock Title 2\ndate: "2024-03-20"\ntags:\n  - javascript\norder: 1\n---\nThis is second mocked content',
  INVALID_FOR_CUSTOM = "This is content without data",
}

export class FileSystemMock {
  private readonly dir: string;

  constructor() {
    this.dir = path.join(process.cwd(), MOCK_DIRECTORY);
  }

  mock(): void {
    fs.mkdirSync(this.dir);

    fs.writeFileSync(path.join(this.dir, MockSlug.NO_EXTENSION), "");

    fs.writeFileSync(
      path.join(this.dir, `${MockSlug.VALID_1}.md`),
      MockMarkdown.VALID_1,
    );
    fs.writeFileSync(
      path.join(this.dir, `${MockSlug.VALID_2}.md`),
      MockMarkdown.VALID_2,
    );
    fs.writeFileSync(
      path.join(this.dir, `${MockSlug.INVALID_FOR_CUSTOM}.md`),
      MockMarkdown.INVALID_FOR_CUSTOM,
    );
  }

  destroy(): void {
    fs.unlinkSync(path.join(this.dir, MockSlug.NO_EXTENSION));

    fs.unlinkSync(path.join(this.dir, `${MockSlug.VALID_1}.md`));
    fs.unlinkSync(path.join(this.dir, `${MockSlug.VALID_2}.md`));
    fs.unlinkSync(path.join(this.dir, `${MockSlug.INVALID_FOR_CUSTOM}.md`));

    fs.rmdirSync(this.dir);
  }
}

// --- MDX directory ---

export const MDX_MOCK_DIRECTORY = "mock-mdx";

export class MdxFileSystemMock {
  private readonly dir: string;

  constructor() {
    this.dir = path.join(process.cwd(), MDX_MOCK_DIRECTORY);
  }

  mock(): void {
    fs.mkdirSync(this.dir);
    fs.writeFileSync(
      path.join(this.dir, "post-1.mdx"),
      "---\ntitle: MDX Post 1\n---\nMDX content 1",
    );
    fs.writeFileSync(
      path.join(this.dir, "post-2.mdx"),
      "---\ntitle: MDX Post 2\n---\nMDX content 2",
    );
  }

  destroy(): void {
    fs.unlinkSync(path.join(this.dir, "post-1.mdx"));
    fs.unlinkSync(path.join(this.dir, "post-2.mdx"));
    fs.rmdirSync(this.dir);
  }
}

// --- Recursive nested directory ---

export const RECURSIVE_MOCK_DIRECTORY = "mock-recursive";

export class RecursiveFileSystemMock {
  private readonly dir: string;

  constructor() {
    this.dir = path.join(process.cwd(), RECURSIVE_MOCK_DIRECTORY);
  }

  mock(): void {
    fs.mkdirSync(this.dir);
    fs.mkdirSync(path.join(this.dir, "discovery"));
    fs.mkdirSync(path.join(this.dir, "delivery"));

    fs.writeFileSync(
      path.join(this.dir, "discovery.mdx"),
      "---\ntitle: Discovery\norder: 1\n---\nDiscovery parent",
    );
    fs.writeFileSync(
      path.join(this.dir, "discovery", "worth-building.mdx"),
      "---\ntitle: Worth Building\norder: 1\n---\nWorth building content",
    );
    fs.writeFileSync(
      path.join(this.dir, "discovery", "user-research.mdx"),
      "---\ntitle: User Research\norder: 2\n---\nUser research content",
    );
    fs.writeFileSync(
      path.join(this.dir, "delivery.mdx"),
      "---\ntitle: Delivery\norder: 2\n---\nDelivery parent",
    );
    fs.writeFileSync(
      path.join(this.dir, "delivery", "ship-early.mdx"),
      "---\ntitle: Ship Early\norder: 1\n---\nShip early content",
    );
  }

  destroy(): void {
    fs.unlinkSync(path.join(this.dir, "discovery.mdx"));
    fs.unlinkSync(path.join(this.dir, "discovery", "worth-building.mdx"));
    fs.unlinkSync(path.join(this.dir, "discovery", "user-research.mdx"));
    fs.unlinkSync(path.join(this.dir, "delivery.mdx"));
    fs.unlinkSync(path.join(this.dir, "delivery", "ship-early.mdx"));

    fs.rmdirSync(path.join(this.dir, "discovery"));
    fs.rmdirSync(path.join(this.dir, "delivery"));
    fs.rmdirSync(this.dir);
  }
}

// --- Blog-like directory (rich frontmatter for query tests) ---

export const BLOG_MOCK_DIRECTORY = "mock-blog";

export class BlogFileSystemMock {
  private readonly dir: string;

  constructor() {
    this.dir = path.join(process.cwd(), BLOG_MOCK_DIRECTORY);
  }

  mock(): void {
    fs.mkdirSync(this.dir);

    fs.writeFileSync(
      path.join(this.dir, "firebase-cost-optimization.mdx"),
      [
        "---",
        "title: Firebase Cost Optimization",
        'date: "2025-08-22"',
        "tags:",
        "  - firebase",
        "  - devops",
        "hidden: false",
        "order: 3",
        "views: 1200",
        "rating: 4.5",
        "author:",
        "  name: Jurij",
        "  role: engineer",
        "---",
        "Firebase cost optimization content.",
      ].join("\n"),
    );

    fs.writeFileSync(
      path.join(this.dir, "why-mvps-fail.mdx"),
      [
        "---",
        "title: Why MVPs Fail",
        'date: "2025-06-10"',
        "tags:",
        "  - product",
        "  - strategy",
        "hidden: false",
        "order: 1",
        "views: 3400",
        "rating: 4.8",
        "---",
        "Why MVPs fail content.",
      ].join("\n"),
    );

    fs.writeFileSync(
      path.join(this.dir, "react-server-components.mdx"),
      [
        "---",
        "title: React Server Components",
        'date: "2025-09-15"',
        "tags:",
        "  - react",
        "  - frontend",
        "hidden: false",
        "order: 2",
        "views: 2100",
        "rating: 4.2",
        "---",
        "React server components content.",
      ].join("\n"),
    );

    fs.writeFileSync(
      path.join(this.dir, "draft-post.mdx"),
      [
        "---",
        "title: Draft Post",
        'date: "2099-12-31"',
        "tags:",
        "  - draft",
        "hidden: true",
        "order: 99",
        "views: 0",
        "rating: 0",
        "---",
        "Draft content.",
      ].join("\n"),
    );

    fs.writeFileSync(
      path.join(this.dir, "no-tags-post.mdx"),
      [
        "---",
        "title: No Tags Post",
        'date: "2025-01-01"',
        "hidden: false",
        "order: 4",
        "views: 500",
        "rating: 3.0",
        "---",
        "Post without tags.",
      ].join("\n"),
    );
  }

  destroy(): void {
    fs.unlinkSync(path.join(this.dir, "firebase-cost-optimization.mdx"));
    fs.unlinkSync(path.join(this.dir, "why-mvps-fail.mdx"));
    fs.unlinkSync(path.join(this.dir, "react-server-components.mdx"));
    fs.unlinkSync(path.join(this.dir, "draft-post.mdx"));
    fs.unlinkSync(path.join(this.dir, "no-tags-post.mdx"));
    fs.rmdirSync(this.dir);
  }
}

// --- Mixed extensions directory ---

export const MIXED_MOCK_DIRECTORY = "mock-mixed";

export class MixedFileSystemMock {
  private readonly dir: string;

  constructor() {
    this.dir = path.join(process.cwd(), MIXED_MOCK_DIRECTORY);
  }

  mock(): void {
    fs.mkdirSync(this.dir);
    fs.writeFileSync(
      path.join(this.dir, "post-md.md"),
      "---\ntitle: MD Post\n---\nMD content",
    );
    fs.writeFileSync(
      path.join(this.dir, "post-mdx.mdx"),
      "---\ntitle: MDX Post\n---\nMDX content",
    );
    fs.writeFileSync(
      path.join(this.dir, "ignored.txt"),
      "This should be ignored",
    );
    fs.writeFileSync(path.join(this.dir, "also-ignored.json"), "{}");
  }

  destroy(): void {
    fs.unlinkSync(path.join(this.dir, "post-md.md"));
    fs.unlinkSync(path.join(this.dir, "post-mdx.mdx"));
    fs.unlinkSync(path.join(this.dir, "ignored.txt"));
    fs.unlinkSync(path.join(this.dir, "also-ignored.json"));
    fs.rmdirSync(this.dir);
  }
}

// --- Empty directory ---

export const EMPTY_MOCK_DIRECTORY = "mock-empty";

export class EmptyFileSystemMock {
  private readonly dir: string;

  constructor() {
    this.dir = path.join(process.cwd(), EMPTY_MOCK_DIRECTORY);
  }

  mock(): void {
    fs.mkdirSync(this.dir);
  }

  destroy(): void {
    fs.rmdirSync(this.dir);
  }
}
