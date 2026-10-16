import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  get,
  limit,
  type MarkdownItem,
  MarkdownRepository,
  MarkdownRepositoryInvalidTypeError,
  MarkdownRepositoryNotFoundError,
  orderBy,
  query,
  where,
} from "./index";
import {
  BLOG_MOCK_DIRECTORY,
  BlogFileSystemMock,
  EMPTY_MOCK_DIRECTORY,
  EmptyFileSystemMock,
  FileSystemMock,
  MDX_MOCK_DIRECTORY,
  MdxFileSystemMock,
  MIXED_MOCK_DIRECTORY,
  MixedFileSystemMock,
  MOCK_DIRECTORY,
  MockContent,
  MockSlug,
  RECURSIVE_MOCK_DIRECTORY,
  RecursiveFileSystemMock,
} from "./index.mock";

interface MockPost extends MarkdownItem {
  title: string;
}

function isValidMockPost(item: MarkdownItem): item is MockPost {
  return typeof item.title === "string";
}

// ============================================================
// MarkdownRepository — backwards compatibility (original tests)
// ============================================================

describe("MarkdownRepository", () => {
  let fileSystem: FileSystemMock;
  let repositoryDefault: MarkdownRepository;
  let repositoryCustom: MarkdownRepository<MockPost>;

  beforeAll(() => {
    fileSystem = new FileSystemMock();
    fileSystem.mock();

    repositoryDefault = new MarkdownRepository(MOCK_DIRECTORY);
    repositoryCustom = new MarkdownRepository<MockPost>(MOCK_DIRECTORY, {
      validator: isValidMockPost,
    });
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  describe("getBySlug", () => {
    it("throws MarkdownRepositoryNotFoundError when no post found", () => {
      expect(() => repositoryDefault.getBySlug(MockSlug.NO_FILE)).toThrow(
        MarkdownRepositoryNotFoundError,
      );
    });

    it("throws MarkdownRepositoryNotFoundError when file exist without .md", () => {
      expect(() => repositoryDefault.getBySlug(MockSlug.NO_EXTENSION)).toThrow(
        MarkdownRepositoryNotFoundError,
      );
    });

    it("throws MarkdownRepositoryInvalidTypeError when post has invalid type on custom repository", () => {
      expect(() =>
        repositoryCustom.getBySlug(MockSlug.INVALID_FOR_CUSTOM),
      ).toThrow(MarkdownRepositoryInvalidTypeError);
    });

    it("does not throw MarkdownRepositoryNotFoundError when post found", () => {
      expect(() => repositoryDefault.getBySlug(MockSlug.VALID_1)).not.toThrow(
        MarkdownRepositoryNotFoundError,
      );
      expect(() => repositoryDefault.getBySlug(MockSlug.VALID_2)).not.toThrow(
        MarkdownRepositoryNotFoundError,
      );
    });

    it("returns valid MarkdownItem [1]", () => {
      const valid1 = repositoryDefault.getBySlug(MockSlug.VALID_1);

      expect(valid1.slug).toEqual(MockSlug.VALID_1);
      expect(valid1.content).toEqual(MockContent.VALID_1);
    });

    it("returns valid MarkdownItem [2]", () => {
      const valid2 = repositoryDefault.getBySlug(MockSlug.VALID_2);

      expect(valid2.slug).toEqual(MockSlug.VALID_2);
      expect(valid2.content).toEqual(MockContent.VALID_2);
    });
  });

  describe("getAll", () => {
    it("returns 3 posts instead of 5 as valid on default repository", () => {
      const posts = repositoryDefault.getAll();

      expect(posts.length).toEqual(3);
    });

    it("returns basic MarkdownItem [0] on default repository", () => {
      const posts = repositoryDefault.getAll();
      const invalidForCustom = posts[0];

      expect(invalidForCustom.slug).toEqual(MockSlug.INVALID_FOR_CUSTOM);
      expect(invalidForCustom.content).toEqual(MockContent.INVALID_FOR_CUSTOM);
    });

    it("returns basic MarkdownItem [1] on default repository", () => {
      const posts = repositoryDefault.getAll();
      const valid1 = posts[1];

      expect(valid1.slug).toEqual(MockSlug.VALID_1);
      expect(valid1.content).toEqual(MockContent.VALID_1);
    });

    it("returns basic MarkdownItem [2] on default repository", () => {
      const posts = repositoryDefault.getAll();
      const valid2 = posts[2];

      expect(valid2.slug).toEqual(MockSlug.VALID_2);
      expect(valid2.content).toEqual(MockContent.VALID_2);
    });

    it("returns 2 posts instead of 5 as valid on custom repository", () => {
      const posts = repositoryCustom.getAll();

      expect(posts.length).toEqual(2);
    });

    it("returns valid MarkdownItem [0] on custom repository", () => {
      const posts = repositoryCustom.getAll();
      const valid1 = posts[0];

      expect(valid1.slug).toEqual(MockSlug.VALID_1);
      expect(valid1.content).toEqual(MockContent.VALID_1);
    });

    it("returns valid MarkdownItem [1] on custom repository", () => {
      const posts = repositoryCustom.getAll();
      const valid2 = posts[1];

      expect(valid2.slug).toEqual(MockSlug.VALID_2);
      expect(valid2.content).toEqual(MockContent.VALID_2);
    });
  });
});

// ============================================================
// MarkdownRepository — constructor and options
// ============================================================

describe("MarkdownRepository constructor", () => {
  let fileSystem: FileSystemMock;

  beforeAll(() => {
    fileSystem = new FileSystemMock();
    fileSystem.mock();
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("reads both .md and .mdx by default when no options provided", () => {
    const repo = new MarkdownRepository(MOCK_DIRECTORY);
    const all = repo.getAll();

    expect(all.length).toEqual(3); // only .md files exist in this directory
  });

  it("reads both .md and .mdx by default when options object has no extensions", () => {
    const repo = new MarkdownRepository(MOCK_DIRECTORY, {});
    const all = repo.getAll();

    expect(all.length).toEqual(3);
  });

  it("accepts validator in options object", () => {
    const repo = new MarkdownRepository<MockPost>(MOCK_DIRECTORY, {
      validator: isValidMockPost,
    });
    const all = repo.getAll();

    expect(all.length).toEqual(2);
  });
});

// ============================================================
// Frontmatter parsing
// ============================================================

describe("frontmatter parsing", () => {
  let fileSystem: BlogFileSystemMock;
  let repo: MarkdownRepository;

  beforeAll(() => {
    fileSystem = new BlogFileSystemMock();
    fileSystem.mock();
    repo = new MarkdownRepository(BLOG_MOCK_DIRECTORY);
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("parses string fields", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(post.title).toEqual("Firebase Cost Optimization");
    expect(post.date).toEqual("2025-08-22");
  });

  it("parses number fields", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(post.order).toEqual(3);
    expect(post.views).toEqual(1200);
  });

  it("parses float fields", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(post.rating).toEqual(4.5);
  });

  it("parses boolean fields", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(post.hidden).toEqual(false);
  });

  it("parses array fields", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(post.tags).toEqual(["firebase", "devops"]);
  });

  it("parses nested object fields", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(post.author).toEqual({ name: "Jurij", role: "engineer" });
  });

  it("returns undefined for missing frontmatter fields", () => {
    const post = repo.getBySlug("no-tags-post");

    expect(post.tags).toBeUndefined();
  });

  it("derives slug from filename without extension", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(post.slug).toEqual("firebase-cost-optimization");
  });

  it("separates content from frontmatter", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(post.content).toContain("Firebase cost optimization content.");
    expect(post.content).not.toContain("title:");
  });

  it("provides excerpt as string", () => {
    const post = repo.getBySlug("firebase-cost-optimization");

    expect(typeof post.excerpt).toEqual("string");
  });
});

// ============================================================
// get() function overloads
// ============================================================

describe("get()", () => {
  let fileSystem: BlogFileSystemMock;
  let repo: MarkdownRepository;

  beforeAll(() => {
    fileSystem = new BlogFileSystemMock();
    fileSystem.mock();
    repo = new MarkdownRepository(BLOG_MOCK_DIRECTORY);
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("get(repo) returns all items", () => {
    const all = get(repo);

    expect(all.length).toEqual(5);
  });

  it("get(repo, slug) returns a single item", () => {
    const post = get(repo, "why-mvps-fail");

    expect(post.title).toEqual("Why MVPs Fail");
  });

  it("get(repo, slug) throws MarkdownRepositoryNotFoundError for missing slug", () => {
    expect(() => get(repo, "nonexistent")).toThrow(
      MarkdownRepositoryNotFoundError,
    );
  });

  it("get(query) returns filtered results", () => {
    const q = query(repo, where("hidden", "==", true));
    const results = get(q);

    expect(results.length).toEqual(1);
    expect(results[0].title).toEqual("Draft Post");
  });

  it("get(query) with no constraints returns all items", () => {
    const q = query(repo);
    const results = get(q);

    expect(results.length).toEqual(5);
  });
});

// ============================================================
// where() — all operators
// ============================================================

describe("where()", () => {
  let fileSystem: BlogFileSystemMock;
  let repo: MarkdownRepository;

  beforeAll(() => {
    fileSystem = new BlogFileSystemMock();
    fileSystem.mock();
    repo = new MarkdownRepository(BLOG_MOCK_DIRECTORY);
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  describe("== (equal)", () => {
    it("matches string value", () => {
      const results = get(query(repo, where("title", "==", "Why MVPs Fail")));

      expect(results.length).toEqual(1);
      expect(results[0].slug).toEqual("why-mvps-fail");
    });

    it("matches boolean value", () => {
      const results = get(query(repo, where("hidden", "==", true)));

      expect(results.length).toEqual(1);
      expect(results[0].slug).toEqual("draft-post");
    });

    it("matches number value", () => {
      const results = get(query(repo, where("order", "==", 3)));

      expect(results.length).toEqual(1);
      expect(results[0].slug).toEqual("firebase-cost-optimization");
    });

    it("returns empty when value does not match", () => {
      const results = get(query(repo, where("title", "==", "Does Not Exist")));

      expect(results.length).toEqual(0);
    });
  });

  describe("!= (not equal)", () => {
    it("excludes matching items", () => {
      const results = get(query(repo, where("hidden", "!=", true)));

      expect(results.length).toEqual(4);
      expect(results.every((r) => r.hidden !== true)).toBe(true);
    });

    it("excludes by string value", () => {
      const results = get(query(repo, where("title", "!=", "Draft Post")));

      expect(results.length).toEqual(4);
      expect(results.some((r) => r.title === "Draft Post")).toBe(false);
    });
  });

  describe("< (less than)", () => {
    it("filters numbers", () => {
      const results = get(query(repo, where("order", "<", 2)));

      expect(results.length).toEqual(1);
      expect(results[0].slug).toEqual("why-mvps-fail"); // order: 1
    });

    it("filters strings lexicographically", () => {
      const results = get(query(repo, where("date", "<", "2025-07-01")));

      // 2025-01-01 and 2025-06-10 are before 2025-07-01
      expect(results.length).toEqual(2);
    });
  });

  describe("<= (less than or equal)", () => {
    it("includes boundary value", () => {
      const results = get(query(repo, where("order", "<=", 2)));

      expect(results.length).toEqual(2); // order 1 and 2
    });
  });

  describe("> (greater than)", () => {
    it("filters numbers", () => {
      const results = get(query(repo, where("views", ">", 2000)));

      expect(results.length).toEqual(2); // 3400 and 2100
    });

    it("filters floats", () => {
      const results = get(query(repo, where("rating", ">", 4.2)));

      expect(results.length).toEqual(2); // 4.5 and 4.8
    });
  });

  describe(">= (greater than or equal)", () => {
    it("includes boundary value", () => {
      const results = get(query(repo, where("rating", ">=", 4.5)));

      expect(results.length).toEqual(2); // 4.5 and 4.8
    });

    it("matches all when value is the minimum", () => {
      const results = get(query(repo, where("views", ">=", 0)));

      expect(results.length).toEqual(5);
    });
  });

  describe("array-contains", () => {
    it("matches item in array field", () => {
      const results = get(
        query(repo, where("tags", "array-contains", "firebase")),
      );

      expect(results.length).toEqual(1);
      expect(results[0].slug).toEqual("firebase-cost-optimization");
    });

    it("returns empty when tag not present in any post", () => {
      const results = get(
        query(repo, where("tags", "array-contains", "python")),
      );

      expect(results.length).toEqual(0);
    });

    it("returns empty when field is not an array", () => {
      const results = get(query(repo, where("title", "array-contains", "x")));

      expect(results.length).toEqual(0);
    });

    it("skips items where field is undefined", () => {
      // no-tags-post has no tags field
      const results = get(
        query(repo, where("tags", "array-contains", "product")),
      );

      expect(results.length).toEqual(1);
      expect(results[0].slug).toEqual("why-mvps-fail");
    });
  });

  describe("array-contains-any", () => {
    it("matches any of the provided values", () => {
      const results = get(
        query(repo, where("tags", "array-contains-any", ["firebase", "react"])),
      );

      expect(results.length).toEqual(2);
      const slugs = results.map((r) => r.slug);
      expect(slugs).toContain("firebase-cost-optimization");
      expect(slugs).toContain("react-server-components");
    });

    it("returns empty when no values match", () => {
      const results = get(
        query(repo, where("tags", "array-contains-any", ["python", "go"])),
      );

      expect(results.length).toEqual(0);
    });

    it("does not match when field is undefined", () => {
      // all results should have tags defined
      const results = get(
        query(repo, where("tags", "array-contains-any", ["product"])),
      );

      expect(results.every((r) => Array.isArray(r.tags))).toBe(true);
    });
  });

  describe("in", () => {
    it("matches field value in provided array", () => {
      const results = get(query(repo, where("order", "in", [1, 3])));

      expect(results.length).toEqual(2);
      const slugs = results.map((r) => r.slug);
      expect(slugs).toContain("why-mvps-fail"); // order: 1
      expect(slugs).toContain("firebase-cost-optimization"); // order: 3
    });

    it("works with string values", () => {
      const results = get(
        query(repo, where("slug", "in", ["draft-post", "no-tags-post"])),
      );

      expect(results.length).toEqual(2);
    });

    it("returns empty when no field values are in the array", () => {
      const results = get(query(repo, where("order", "in", [100, 200])));

      expect(results.length).toEqual(0);
    });
  });

  describe("not-in", () => {
    it("excludes field values in provided array", () => {
      const results = get(query(repo, where("order", "not-in", [99, 4])));

      expect(results.length).toEqual(3); // excludes draft (99) and no-tags (4)
      expect(results.every((r) => r.order !== 99 && r.order !== 4)).toBe(true);
    });

    it("returns all when exclusion array matches nothing", () => {
      const results = get(query(repo, where("order", "not-in", [100, 200])));

      expect(results.length).toEqual(5);
    });
  });

  describe("multiple where constraints", () => {
    it("ANDs two where clauses", () => {
      const results = get(
        query(repo, where("hidden", "==", false), where("views", ">", 1000)),
      );

      expect(results.length).toEqual(3); // firebase (1200), mvps (3400), react (2100)
    });

    it("ANDs three where clauses", () => {
      const results = get(
        query(
          repo,
          where("hidden", "==", false),
          where("views", ">", 1000),
          where("rating", ">=", 4.5),
        ),
      );

      expect(results.length).toEqual(2); // firebase (4.5) and mvps (4.8)
    });

    it("returns empty when constraints are contradictory", () => {
      const results = get(
        query(repo, where("hidden", "==", true), where("hidden", "==", false)),
      );

      expect(results.length).toEqual(0);
    });
  });
});

// ============================================================
// orderBy()
// ============================================================

describe("orderBy()", () => {
  let fileSystem: BlogFileSystemMock;
  let repo: MarkdownRepository;

  beforeAll(() => {
    fileSystem = new BlogFileSystemMock();
    fileSystem.mock();
    repo = new MarkdownRepository(BLOG_MOCK_DIRECTORY);
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("sorts ascending by number (default direction)", () => {
    const results = get(query(repo, orderBy("order")));

    const orders = results.map((r) => r.order);
    expect(orders).toEqual([1, 2, 3, 4, 99]);
  });

  it("sorts descending by number", () => {
    const results = get(query(repo, orderBy("order", "desc")));

    const orders = results.map((r) => r.order);
    expect(orders).toEqual([99, 4, 3, 2, 1]);
  });

  it("sorts ascending by string", () => {
    const results = get(query(repo, orderBy("date", "asc")));

    const dates = results.map((r) => r.date);
    expect(dates).toEqual([
      "2025-01-01",
      "2025-06-10",
      "2025-08-22",
      "2025-09-15",
      "2099-12-31",
    ]);
  });

  it("sorts descending by string", () => {
    const results = get(query(repo, orderBy("date", "desc")));

    const dates = results.map((r) => r.date);
    expect(dates).toEqual([
      "2099-12-31",
      "2025-09-15",
      "2025-08-22",
      "2025-06-10",
      "2025-01-01",
    ]);
  });

  it("sorts by float", () => {
    const results = get(query(repo, orderBy("rating", "desc")));

    const ratings = results.map((r) => r.rating);
    expect(ratings).toEqual([4.8, 4.5, 4.2, 3.0, 0]);
  });

  it("uses secondary sort for tie-breaking", () => {
    // hidden=false has 4 items, hidden=true has 1
    // Primary: hidden asc (false < true), Secondary: order asc
    const results = get(
      query(repo, orderBy("hidden", "asc"), orderBy("order", "asc")),
    );

    // false items first (ordered 1,2,3,4), then true item (99)
    const orders = results.map((r) => r.order);
    expect(orders).toEqual([1, 2, 3, 4, 99]);
  });

  it("secondary sort breaks ties in descending primary", () => {
    const results = get(
      query(repo, orderBy("hidden", "desc"), orderBy("views", "desc")),
    );

    // hidden=true first (draft, views=0), then hidden=false sorted by views desc
    expect(results[0].slug).toEqual("draft-post");
    expect(results[1].views).toEqual(3400);
    expect(results[2].views).toEqual(2100);
    expect(results[3].views).toEqual(1200);
    expect(results[4].views).toEqual(500);
  });
});

// ============================================================
// limit()
// ============================================================

describe("limit()", () => {
  let fileSystem: BlogFileSystemMock;
  let repo: MarkdownRepository;

  beforeAll(() => {
    fileSystem = new BlogFileSystemMock();
    fileSystem.mock();
    repo = new MarkdownRepository(BLOG_MOCK_DIRECTORY);
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("limits to specified count", () => {
    const results = get(query(repo, limit(2)));

    expect(results.length).toEqual(2);
  });

  it("returns all when limit exceeds total count", () => {
    const results = get(query(repo, limit(100)));

    expect(results.length).toEqual(5);
  });

  it("returns empty when limit is 0", () => {
    const results = get(query(repo, limit(0)));

    expect(results.length).toEqual(0);
  });

  it("limits to 1", () => {
    const results = get(query(repo, limit(1)));

    expect(results.length).toEqual(1);
  });

  it("applies after sorting", () => {
    const results = get(query(repo, orderBy("views", "desc"), limit(3)));

    expect(results.length).toEqual(3);
    expect(results[0].views).toEqual(3400);
    expect(results[1].views).toEqual(2100);
    expect(results[2].views).toEqual(1200);
  });

  it("applies after filtering", () => {
    const results = get(query(repo, where("hidden", "==", false), limit(2)));

    expect(results.length).toEqual(2);
    expect(results.every((r) => r.hidden === false)).toBe(true);
  });
});

// ============================================================
// Composed queries (where + orderBy + limit)
// ============================================================

describe("composed queries", () => {
  let fileSystem: BlogFileSystemMock;
  let repo: MarkdownRepository;

  beforeAll(() => {
    fileSystem = new BlogFileSystemMock();
    fileSystem.mock();
    repo = new MarkdownRepository(BLOG_MOCK_DIRECTORY);
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("filter + sort + limit: top 2 most viewed non-hidden posts", () => {
    const results = get(
      query(
        repo,
        where("hidden", "==", false),
        orderBy("views", "desc"),
        limit(2),
      ),
    );

    expect(results.length).toEqual(2);
    expect(results[0].title).toEqual("Why MVPs Fail"); // 3400
    expect(results[1].title).toEqual("React Server Components"); // 2100
  });

  it("filter + sort: posts by date descending, excluding drafts", () => {
    const results = get(
      query(repo, where("hidden", "!=", true), orderBy("date", "desc")),
    );

    expect(results.length).toEqual(4);
    expect(results[0].date).toEqual("2025-09-15");
    expect(results[3].date).toEqual("2025-01-01");
  });

  it("tag filter + sort: firebase/devops posts by rating", () => {
    const results = get(
      query(
        repo,
        where("tags", "array-contains-any", ["firebase", "devops"]),
        orderBy("rating", "desc"),
      ),
    );

    expect(results.length).toEqual(1);
    expect(results[0].slug).toEqual("firebase-cost-optimization");
  });

  it("dynamic constraint composition with spread", () => {
    const constraints = [where("hidden", "==", false)];
    constraints.push(orderBy("order", "asc"));
    constraints.push(limit(3));

    const results = get(query(repo, ...constraints));

    expect(results.length).toEqual(3);
    expect(results[0].order).toEqual(1);
    expect(results[1].order).toEqual(2);
    expect(results[2].order).toEqual(3);
  });

  it("conditionally adding constraints", () => {
    const tag: string | undefined = "react";
    const constraints = [where("hidden", "==", false)];

    if (tag !== undefined) {
      constraints.push(where("tags", "array-contains", tag));
    }

    constraints.push(orderBy("date", "desc"));

    const results = get(query(repo, ...constraints));

    expect(results.length).toEqual(1);
    expect(results[0].slug).toEqual("react-server-components");
  });

  it("conditionally skipping constraints", () => {
    const tag: string | undefined = undefined;
    const constraints = [where("hidden", "==", false)];

    if (tag !== undefined) {
      constraints.push(where("tags", "array-contains", tag));
    }

    constraints.push(orderBy("date", "desc"));

    const results = get(query(repo, ...constraints));

    expect(results.length).toEqual(4); // all non-hidden
  });
});

// ============================================================
// Extensions
// ============================================================

describe("extensions", () => {
  let mdxFs: MdxFileSystemMock;
  let mixedFs: MixedFileSystemMock;

  beforeAll(() => {
    mdxFs = new MdxFileSystemMock();
    mdxFs.mock();
    mixedFs = new MixedFileSystemMock();
    mixedFs.mock();
  });

  afterAll(() => {
    mdxFs.destroy();
    mixedFs.destroy();
  });

  it("reads .mdx files by default", () => {
    const repo = new MarkdownRepository(MDX_MOCK_DIRECTORY);

    expect(repo.getAll().length).toEqual(2);
  });

  it("getBySlug works with .mdx files by default", () => {
    const repo = new MarkdownRepository(MDX_MOCK_DIRECTORY);
    const post = repo.getBySlug("post-1");

    expect(post.content).toEqual("MDX content 1");
  });

  it("restricts to .md only when explicitly configured", () => {
    const repo = new MarkdownRepository(MDX_MOCK_DIRECTORY, {
      extensions: [".md"],
    });

    expect(repo.getAll().length).toEqual(0);
  });

  it("reads both .md and .mdx by default in mixed directory", () => {
    const repo = new MarkdownRepository(MIXED_MOCK_DIRECTORY);
    const all = repo.getAll();

    expect(all.length).toEqual(2);
    const slugs = all.map((i) => i.slug);
    expect(slugs).toContain("post-md");
    expect(slugs).toContain("post-mdx");
  });

  it("ignores non-markdown extensions (.txt, .json)", () => {
    const repo = new MarkdownRepository(MIXED_MOCK_DIRECTORY);
    const slugs = repo.getAll().map((i) => i.slug);

    expect(slugs).not.toContain("ignored");
    expect(slugs).not.toContain("also-ignored");
  });

  it("getBySlug resolves correct extension from .md and .mdx", () => {
    const repo = new MarkdownRepository(MIXED_MOCK_DIRECTORY);

    const md = repo.getBySlug("post-md");
    expect(md.content).toEqual("MD content");

    const mdx = repo.getBySlug("post-mdx");
    expect(mdx.content).toEqual("MDX content");
  });
});

// ============================================================
// Recursive directories
// ============================================================

describe("recursive directories", () => {
  let fileSystem: RecursiveFileSystemMock;

  beforeAll(() => {
    fileSystem = new RecursiveFileSystemMock();
    fileSystem.mock();
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("reads all files in nested directories", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
    });

    expect(repo.getAll().length).toEqual(5);
  });

  it("creates path-based slugs", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
    });
    const slugs = repo.getAll().map((i) => i.slug);

    expect(slugs).toContain("discovery");
    expect(slugs).toContain("discovery/worth-building");
    expect(slugs).toContain("discovery/user-research");
    expect(slugs).toContain("delivery");
    expect(slugs).toContain("delivery/ship-early");
  });

  it("getBySlug with nested slug", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
    });
    const post = repo.getBySlug("discovery/worth-building");

    expect(post.title).toEqual("Worth Building");
    expect(post.content).toContain("Worth building content");
  });

  it("getBySlug with parent-level slug", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
    });
    const post = repo.getBySlug("discovery");

    expect(post.title).toEqual("Discovery");
  });

  it("throws MarkdownRepositoryNotFoundError for nonexistent nested slug", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
    });

    expect(() => repo.getBySlug("discovery/nonexistent")).toThrow(
      MarkdownRepositoryNotFoundError,
    );
  });

  it("does not recurse when recursive is false", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      extensions: [".mdx"],
      recursive: false,
    });

    expect(repo.getAll().length).toEqual(2); // discovery.mdx and delivery.mdx only
  });

  it("query with where works on recursive repository", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
    });
    const results = get(query(repo, where("order", "==", 2)));

    expect(results.length).toEqual(2); // delivery (order:2) and user-research (order:2)
  });

  it("query with orderBy works on recursive repository", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
    });
    const results = get(query(repo, orderBy("title", "asc")));

    const titles = results.map((r) => r.title);
    expect(titles).toEqual([
      "Delivery",
      "Discovery",
      "Ship Early",
      "User Research",
      "Worth Building",
    ]);
  });

  it("query with where + orderBy + limit on recursive repository", () => {
    const repo = new MarkdownRepository(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
    });
    const results = get(
      query(repo, where("order", "==", 1), orderBy("title", "asc"), limit(2)),
    );

    expect(results.length).toEqual(2);
    expect(results[0].title).toEqual("Discovery");
    expect(results[1].title).toEqual("Ship Early");
  });

  it("validator works with recursive repository", () => {
    const repo = new MarkdownRepository<MockPost>(RECURSIVE_MOCK_DIRECTORY, {
      recursive: true,
      validator: isValidMockPost,
    });

    expect(repo.getAll().length).toEqual(5); // all have title
  });
});

// ============================================================
// Empty directory
// ============================================================

describe("empty directory", () => {
  let fileSystem: EmptyFileSystemMock;

  beforeAll(() => {
    fileSystem = new EmptyFileSystemMock();
    fileSystem.mock();
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("getAll returns empty array", () => {
    const repo = new MarkdownRepository(EMPTY_MOCK_DIRECTORY);

    expect(repo.getAll()).toEqual([]);
  });

  it("get(repo) returns empty array", () => {
    const repo = new MarkdownRepository(EMPTY_MOCK_DIRECTORY);

    expect(get(repo)).toEqual([]);
  });

  it("query on empty directory returns empty array", () => {
    const repo = new MarkdownRepository(EMPTY_MOCK_DIRECTORY);
    const results = get(query(repo, where("title", "==", "anything")));

    expect(results).toEqual([]);
  });

  it("getBySlug throws on empty directory", () => {
    const repo = new MarkdownRepository(EMPTY_MOCK_DIRECTORY);

    expect(() => repo.getBySlug("anything")).toThrow(
      MarkdownRepositoryNotFoundError,
    );
  });
});

// ============================================================
// Error handling
// ============================================================

describe("error handling", () => {
  let fileSystem: FileSystemMock;

  beforeAll(() => {
    fileSystem = new FileSystemMock();
    fileSystem.mock();
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  it("MarkdownRepositoryNotFoundError is instance of Error", () => {
    const error = new MarkdownRepositoryNotFoundError("test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MarkdownRepositoryNotFoundError);
  });

  it("MarkdownRepositoryInvalidTypeError is instance of Error", () => {
    const error = new MarkdownRepositoryInvalidTypeError("test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MarkdownRepositoryInvalidTypeError);
  });

  it("errors can be caught by type", () => {
    const repo = new MarkdownRepository(MOCK_DIRECTORY);
    let caught = false;

    try {
      repo.getBySlug("nonexistent");
    } catch (error) {
      if (error instanceof MarkdownRepositoryNotFoundError) {
        caught = true;
      }
    }

    expect(caught).toBe(true);
  });

  it("MarkdownRepositoryInvalidTypeError is distinguishable from NotFoundError", () => {
    const repo = new MarkdownRepository<MockPost>(MOCK_DIRECTORY, {
      validator: isValidMockPost,
    });
    let caughtType = "";

    try {
      repo.getBySlug(MockSlug.INVALID_FOR_CUSTOM);
    } catch (error) {
      if (error instanceof MarkdownRepositoryNotFoundError) {
        caughtType = "not-found";
      } else if (error instanceof MarkdownRepositoryInvalidTypeError) {
        caughtType = "invalid-type";
      }
    }

    expect(caughtType).toEqual("invalid-type");
  });
});

// ============================================================
// Directory resolution — relative and absolute directories
// ============================================================

describe("directory resolution", () => {
  let tmp: string;
  let appDir: string;
  let sharedDir: string;
  let leadingSlashName: string;

  function writePost(dir: string, name: string, title: string): void {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${name}.md`),
      `---\ntitle: ${title}\n---\n${title} body`,
    );
  }

  beforeAll(() => {
    tmp = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "markdown-repository-")),
    );
    appDir = path.join(tmp, "app");
    sharedDir = path.join(tmp, "shared", "posts");
    leadingSlashName = `leading-slash-${path.basename(tmp)}`;

    writePost(path.join(appDir, "content", "posts"), "in-app", "In app");
    writePost(sharedDir, "in-shared", "In shared");
    writePost(path.join(sharedDir, "nested"), "deep", "Deep");
    writePost(path.join(appDir, leadingSlashName, "posts"), "in-app", "In app");
  });

  beforeEach(() => {
    jest.spyOn(process, "cwd").mockReturnValue(appDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("resolves a relative directory against process.cwd()", () => {
    const repo = new MarkdownRepository("content/posts");

    expect(repo.getAll().map((p) => p.slug)).toEqual(["in-app"]);
    expect(repo.getBySlug("in-app").content).toEqual("In app body");
  });

  it("resolves a relative directory that points outside cwd", () => {
    const repo = new MarkdownRepository("../shared/posts");

    expect(repo.getAll().map((p) => p.slug)).toEqual(["in-shared"]);
  });

  it("reads an absolute directory outside process.cwd()", () => {
    const repo = new MarkdownRepository(sharedDir);

    expect(repo.getAll().map((p) => p.slug)).toEqual(["in-shared"]);
    expect(repo.getBySlug("in-shared").content).toEqual("In shared body");
  });

  it("reads an absolute directory inside process.cwd()", () => {
    const repo = new MarkdownRepository(path.join(appDir, "content", "posts"));

    expect(repo.getAll().map((p) => p.slug)).toEqual(["in-app"]);
    expect(repo.getBySlug("in-app").content).toEqual("In app body");
  });

  it("reads an absolute directory with a trailing separator", () => {
    const repo = new MarkdownRepository(`${sharedDir}${path.sep}`);

    expect(repo.getAll().map((p) => p.slug)).toEqual(["in-shared"]);
  });

  it("keeps slugs relative to the directory for an absolute recursive repository", () => {
    const repo = new MarkdownRepository(sharedDir, { recursive: true });

    expect(repo.getAll().map((p) => p.slug)).toEqual([
      "in-shared",
      "nested/deep",
    ]);
    expect(repo.getBySlug("nested/deep").content).toEqual("Deep body");
  });

  it("reports a missing absolute directory by its own path, not nested under cwd", () => {
    const missing = path.join(tmp, "does-not-exist");
    const repo = new MarkdownRepository(missing);

    expect(() => repo.getAll()).toThrow(`scandir '${missing}'`);
  });

  it("treats a leading-slash directory as absolute, not as relative to cwd", () => {
    // Before the fix "/x/posts" silently meant "<cwd>/x/posts".
    expect(
      new MarkdownRepository(`${leadingSlashName}/posts`).getAll(),
    ).toHaveLength(1);

    const leadingSlash = new MarkdownRepository(`/${leadingSlashName}/posts`);

    expect(() => leadingSlash.getAll()).toThrow(
      `scandir '${path.resolve(`/${leadingSlashName}/posts`)}'`,
    );
  });
});

// ============================================================
// Constraint factories (unit tests for where/orderBy/limit)
// ============================================================

describe("constraint factories", () => {
  it("where() returns a WhereConstraint", () => {
    const c = where("field", "==", "value");

    expect(c).toEqual({
      type: "where",
      field: "field",
      op: "==",
      value: "value",
    });
  });

  it("where() preserves complex values", () => {
    const c = where("tags", "array-contains-any", ["a", "b"]);

    expect(c).toEqual({
      type: "where",
      field: "tags",
      op: "array-contains-any",
      value: ["a", "b"],
    });
  });

  it("orderBy() defaults to ascending", () => {
    const c = orderBy("date");

    expect(c).toEqual({ type: "orderBy", field: "date", direction: "asc" });
  });

  it("orderBy() accepts desc direction", () => {
    const c = orderBy("date", "desc");

    expect(c).toEqual({ type: "orderBy", field: "date", direction: "desc" });
  });

  it("limit() returns a LimitConstraint", () => {
    const c = limit(10);

    expect(c).toEqual({ type: "limit", count: 10 });
  });
});
