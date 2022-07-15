import { FileSystemMock, MockContent, MockSlug, MOCK_DIRECTORY } from "./index.mock";

import { MarkdownItem, MarkdownRepository, MarkdownRepositoryInvalidTypeError, MarkdownRepositoryNotFoundError } from "./index";

interface MockPost extends MarkdownItem {
  title: string
}

function isValidMockPost (item: MarkdownItem): item is MockPost {
  return typeof item.title === "string";
}

describe("MarkdownRepository", () => {
  let fileSystem: FileSystemMock;
  let repositoryDefault: MarkdownRepository;
  let repositoryCustom: MarkdownRepository<MockPost>;

  beforeAll(() => {
    fileSystem = new FileSystemMock();
    fileSystem.mock();

    repositoryDefault = new MarkdownRepository(MOCK_DIRECTORY);
    repositoryCustom = new MarkdownRepository<MockPost>(MOCK_DIRECTORY, isValidMockPost);
  });

  afterAll(() => {
    fileSystem.destroy();
  });

  describe("getBySlug", () => {
    it("throws MarkdownRepositoryNotFoundError when no post found", () => {
      expect(() => repositoryDefault.getBySlug(MockSlug.NO_FILE)).toThrow(MarkdownRepositoryNotFoundError);
    });

    it("throws MarkdownRepositoryNotFoundError when file exist without .md", () => {
      expect(() => repositoryDefault.getBySlug(MockSlug.NO_EXTENSION)).toThrow(MarkdownRepositoryNotFoundError);
    });

    it("throws MarkdownRepositoryInvalidTypeError when post has invalid type on custom repository", () => {
      expect(() => repositoryCustom.getBySlug(MockSlug.INVALID_FOR_CUSTOM)).toThrow(MarkdownRepositoryInvalidTypeError);
    });

    it("does not throw MarkdownRepositoryNotFoundError when post found", () => {
      expect(() => repositoryDefault.getBySlug(MockSlug.VALID_1)).not.toThrow(MarkdownRepositoryNotFoundError);
      expect(() => repositoryDefault.getBySlug(MockSlug.VALID_2)).not.toThrow(MarkdownRepositoryNotFoundError);
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
