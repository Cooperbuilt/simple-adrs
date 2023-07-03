const fs = require("fs");
const {
  toTitleCase,
  createAdrFiles,
  addSupersededByNote,
  getNextAdrNumber,
} = require("./index"); // replace with your actual file path

jest.mock("fs");

describe("ADR tools tests", () => {
  beforeEach(() => {
    fs.existsSync.mockClear();
    fs.mkdirSync.mockClear();
    fs.writeFileSync.mockClear();
    fs.readdirSync.mockClear();
  });

  test("toTitleCase converts string to title case", () => {
    const input = "hello world";
    const output = toTitleCase(input);
    expect(output).toBe("Hello World");
  });

  test("createAdrFiles creates new directory and file if they do not exist", () => {
    fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);
    createAdrFiles();

    expect(fs.mkdirSync).toHaveBeenCalledWith("./adr");
    expect(fs.writeFileSync).toHaveBeenCalledWith("./adr/RECORD.md", "");
  });

  test("addSupersededByNote appends supersededByNote to the file and the record", () => {
    const startingRecordMdContent = `
## [Previous](0010-previous.md)
stuff here
    `;
    fs.readFileSync.mockReturnValueOnce(startingRecordMdContent);
    addSupersededByNote(
      "0010-previous.md",
      "- superseded by: [New Adr](./0011-new-adr.md)",
      "./adr",
      "./adr/RECORD.md"
    );

    expect(fs.appendFileSync).toHaveBeenNthCalledWith(
      1,
      "./adr/0010-previous.md",
      "- superseded by: [New Adr](./0011-new-adr.md)"
    );

    expect(fs.writeFileSync.mock.calls[0][0]).toBe("./adr/RECORD.md");
    expect(fs.writeFileSync.mock.calls[0][1]).toMatchInlineSnapshot(`
"
## [Previous](0010-previous.md)
stuff here
    
- superseded by: [New Adr](./0011-new-adr.md)
"
`);
  });

  test("getNextAdrNumber calculates next ADR number", () => {
    fs.readdirSync.mockReturnValue([
      "0001-first.md",
      "0002-second.md",
      "RECORD.md",
    ]);
    const nextNumber = getNextAdrNumber("./adr");

    expect(nextNumber).toBe("0003");
  });
  test("getNextAdrNumber calculates next ADR number at hundreds place", () => {
    fs.readdirSync.mockReturnValue([
      "0098-cool-adr.md",
      "0099-cooler-adr.md",
      "RECORD.md",
    ]);
    const nextNumber = getNextAdrNumber("./adr");

    expect(nextNumber).toBe("0100");
  });
});
