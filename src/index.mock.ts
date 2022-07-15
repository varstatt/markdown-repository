import fs from "fs";
import path from "path";

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
  VALID_1 = "---\ntitle: Mock Title 1\n---\nThis is mocked content",
  VALID_2 = "---\ntitle: Mock Title 2\n---\nThis is second mocked content",
  INVALID_FOR_CUSTOM = "This is content without data",
}

export class FileSystemMock {
  private readonly dir: string;

  constructor () {
    this.dir = path.join(process.cwd(), MOCK_DIRECTORY);
  }

  mock (): void {
    fs.mkdirSync(this.dir);

    fs.writeFileSync(path.join(this.dir, MockSlug.NO_EXTENSION), "");

    fs.writeFileSync(path.join(this.dir, `${MockSlug.VALID_1}.md`), MockMarkdown.VALID_1);
    fs.writeFileSync(path.join(this.dir, `${MockSlug.VALID_2}.md`), MockMarkdown.VALID_2);
    fs.writeFileSync(path.join(this.dir, `${MockSlug.INVALID_FOR_CUSTOM}.md`), MockMarkdown.INVALID_FOR_CUSTOM);
  }

  destroy (): void {
    fs.unlinkSync(path.join(this.dir, MockSlug.NO_EXTENSION));

    fs.unlinkSync(path.join(this.dir, `${MockSlug.VALID_1}.md`));
    fs.unlinkSync(path.join(this.dir, `${MockSlug.VALID_2}.md`));
    fs.unlinkSync(path.join(this.dir, `${MockSlug.INVALID_FOR_CUSTOM}.md`));

    fs.rmdirSync(this.dir);
  }
}
