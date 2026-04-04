import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// --- Errors ---

export class MarkdownRepositoryNotFoundError extends Error {}

export class MarkdownRepositoryInvalidTypeError extends Error {}

// --- Types ---

// biome-ignore lint/suspicious/noExplicitAny: frontmatter values are dynamically typed
type Value = any;

export interface MarkdownItem {
  slug: string;
  content: string;
  excerpt: string;
  [key: string]: Value;
}

export type WhereFilterOp =
  | "=="
  | "!="
  | "<"
  | "<="
  | ">="
  | ">"
  | "array-contains"
  | "array-contains-any"
  | "in"
  | "not-in";

export type OrderByDirection = "asc" | "desc";

export interface RepositoryOptions<T extends MarkdownItem> {
  extensions?: string[];
  recursive?: boolean;
  validator?: (item: MarkdownItem) => item is T;
}

// --- Constraints ---

interface BaseConstraint {
  type: "where" | "orderBy" | "limit";
}

interface WhereConstraint extends BaseConstraint {
  type: "where";
  field: string;
  op: WhereFilterOp;
  value: Value;
}

interface OrderByConstraint extends BaseConstraint {
  type: "orderBy";
  field: string;
  direction: OrderByDirection;
}

interface LimitConstraint extends BaseConstraint {
  type: "limit";
  count: number;
}

type QueryConstraint = WhereConstraint | OrderByConstraint | LimitConstraint;

// --- Query ---

export interface MarkdownQuery<T extends MarkdownItem> {
  _repository: MarkdownRepository<T>;
  _constraints: QueryConstraint[];
}

// --- Constraint factories (Firestore-style free functions) ---

export function where(
  field: string,
  op: WhereFilterOp,
  value: Value,
): QueryConstraint {
  return { type: "where", field, op, value };
}

export function orderBy(
  field: string,
  direction: OrderByDirection = "asc",
): QueryConstraint {
  return { type: "orderBy", field, direction };
}

export function limit(count: number): QueryConstraint {
  return { type: "limit", count };
}

// --- query() and get() ---

export function query<T extends MarkdownItem>(
  repository: MarkdownRepository<T>,
  ...constraints: QueryConstraint[]
): MarkdownQuery<T> {
  return { _repository: repository, _constraints: constraints };
}

export function get<T extends MarkdownItem>(
  source: MarkdownRepository<T>,
  slug: string,
): T;
export function get<T extends MarkdownItem>(source: MarkdownRepository<T>): T[];
export function get<T extends MarkdownItem>(source: MarkdownQuery<T>): T[];
export function get<T extends MarkdownItem>(
  source: MarkdownRepository<T> | MarkdownQuery<T>,
  slug?: string,
): T | T[] {
  // get(repository, slug) — single item
  if (source instanceof MarkdownRepository && typeof slug === "string") {
    return source.getBySlug(slug);
  }

  // get(repository) — all items
  if (source instanceof MarkdownRepository) {
    return source.getAll();
  }

  // get(query) — filtered/sorted items
  const q = source as MarkdownQuery<T>;
  return applyConstraints(q._repository.getAll(), q._constraints);
}

// --- Constraint execution ---

function compareValues(a: Value, b: Value): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
  return String(a).localeCompare(String(b));
}

function matchesWhere<T extends MarkdownItem>(
  item: T,
  constraint: WhereConstraint,
): boolean {
  const fieldValue = item[constraint.field];

  switch (constraint.op) {
    case "==":
      return fieldValue === constraint.value;
    case "!=":
      return fieldValue !== constraint.value;
    case "<":
      return compareValues(fieldValue, constraint.value) < 0;
    case "<=":
      return compareValues(fieldValue, constraint.value) <= 0;
    case ">=":
      return compareValues(fieldValue, constraint.value) >= 0;
    case ">":
      return compareValues(fieldValue, constraint.value) > 0;
    case "array-contains":
      return Array.isArray(fieldValue) && fieldValue.includes(constraint.value);
    case "array-contains-any":
      return (
        Array.isArray(fieldValue) &&
        Array.isArray(constraint.value) &&
        constraint.value.some((v: Value) => fieldValue.includes(v))
      );
    case "in":
      return (
        Array.isArray(constraint.value) && constraint.value.includes(fieldValue)
      );
    case "not-in":
      return (
        Array.isArray(constraint.value) &&
        !constraint.value.includes(fieldValue)
      );
    default:
      return true;
  }
}

function applyConstraints<T extends MarkdownItem>(
  items: T[],
  constraints: QueryConstraint[],
): T[] {
  let result = [...items];

  // Apply where filters
  for (const c of constraints) {
    if (c.type === "where") {
      result = result.filter((item) => matchesWhere(item, c));
    }
  }

  // Apply orderBy (in order — first orderBy is primary sort)
  const orderConstraints = constraints.filter(
    (c): c is OrderByConstraint => c.type === "orderBy",
  );
  if (orderConstraints.length > 0) {
    result.sort((a, b) => {
      for (const oc of orderConstraints) {
        const cmp = compareValues(a[oc.field], b[oc.field]);
        if (cmp !== 0) return oc.direction === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }

  // Apply limit
  const limitConstraint = constraints.find(
    (c): c is LimitConstraint => c.type === "limit",
  );
  if (limitConstraint != null) {
    result = result.slice(0, limitConstraint.count);
  }

  return result;
}

// --- Repository ---

const DEFAULT_EXTENSIONS = [".md", ".mdx"];
const FILE_CHARSET = "utf8";

function defaultValidator<T extends MarkdownItem = MarkdownItem>(
  item: MarkdownItem,
): item is T {
  return (
    typeof item.slug === "string" &&
    typeof item.content === "string" &&
    typeof item.excerpt === "string"
  );
}

export class MarkdownRepository<T extends MarkdownItem = MarkdownItem> {
  private readonly extensions: string[];
  private readonly recursive: boolean;
  private readonly validator: (item: MarkdownItem) => item is T;

  constructor(
    protected directory: string,
    options?: RepositoryOptions<T>,
  ) {
    this.extensions = options?.extensions ?? DEFAULT_EXTENSIONS;
    this.recursive = options?.recursive ?? false;
    this.validator = options?.validator ?? defaultValidator;
  }

  private getDirectoryPath(): string {
    return path.join(process.cwd(), this.directory);
  }

  private isMarkdownFile(fileName: string): boolean {
    return this.extensions.some((ext) => fileName.endsWith(ext));
  }

  private getSlugByFileName(fileName: string): string {
    for (const ext of this.extensions) {
      if (fileName.endsWith(ext)) {
        return fileName.slice(0, -ext.length);
      }
    }
    return fileName;
  }

  private getFileNameBySlug(slug: string): string | undefined {
    const dir = this.getDirectoryPath();
    for (const ext of this.extensions) {
      const filePath = path.join(dir, `${slug}${ext}`);
      if (fs.existsSync(filePath)) return `${slug}${ext}`;
    }
    return undefined;
  }

  private readFile(filePath: string): string {
    return fs.readFileSync(
      path.join(this.getDirectoryPath(), filePath),
      FILE_CHARSET,
    );
  }

  private collectFiles(dir: string, base: string = ""): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const rel = base !== "" ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory() && this.recursive) {
        files.push(...this.collectFiles(path.join(dir, entry.name), rel));
      } else if (entry.isFile() && this.isMarkdownFile(entry.name)) {
        files.push(rel);
      }
    }

    return files;
  }

  private parseMarkdown(fileContents: string): matter.GrayMatterFile<string> {
    return matter(fileContents, { excerpt: true });
  }

  private getRawPost(slug: string): MarkdownItem {
    const fileName = this.getFileNameBySlug(slug);
    if (fileName == null) {
      throw new MarkdownRepositoryNotFoundError(slug);
    }

    const content = this.readFile(fileName);
    const parsed = this.parseMarkdown(content);

    return {
      slug,
      content: parsed.content,
      excerpt: parsed.excerpt ?? "",
      ...parsed.data,
    };
  }

  private getRawPosts(): MarkdownItem[] {
    const files = this.collectFiles(this.getDirectoryPath());
    return files.map((filePath) => {
      const slug = this.getSlugByFileName(filePath);
      const content = this.readFile(filePath);
      const parsed = this.parseMarkdown(content);

      return {
        slug,
        content: parsed.content,
        excerpt: parsed.excerpt ?? "",
        ...parsed.data,
      };
    });
  }

  getBySlug(slug: string): T {
    const raw = this.getRawPost(slug);

    if (this.validator(raw)) {
      return raw;
    }

    throw new MarkdownRepositoryInvalidTypeError(slug);
  }

  getAll(): T[] {
    return this.getRawPosts().filter(this.validator);
  }
}
