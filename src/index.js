const fs = require("fs");
const inquirer = require("inquirer");

// Define the templates
const adrTemplate = `
# {{adrTitleCase}}

## Context and Problem Statement

<!-- write a few short sentences about the problem faced and any context involved -->

## Considered Alternatives

<!-- bullet list of any other considerations. Can include notes -->

## Decision Outcome

<!-- short description of the outcome -->

## Accepted Costs / Tradeoffs

<!-- We considered X and decided it was mitigated by Y, it came with Z downside -->

## More Information

<!-- optional section, feel free to delete entirely or add links / more detail -->

## Record notes
{{supersedesNote}}
`;

const recordTemplate = `
## [{{adrTitleCase}}]({{adrFileName}})

<!-- EDIT ME!! Please add full decision outcome text here before committing -->

{{supersedesNote}}
`;

const defaultAdrDir = "./adr";
const defaultRecordPath = "./adr/RECORD.md";

// Function to title case any input
const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Function to create ADR directory and RECORD.md if they don't exist
const createAdrFiles = (
  adrDir = defaultAdrDir,
  recordPath = defaultRecordPath
) => {
  if (!fs.existsSync(adrDir)) {
    fs.mkdirSync(adrDir);
  }
  if (!fs.existsSync(recordPath)) {
    fs.writeFileSync(recordPath, "");
  }
};

// Function to get next ADR number
const getNextAdrNumber = (adrDir) => {
  const files = fs.readdirSync(adrDir);
  const adrFiles = files.filter(
    (file) => file.endsWith(".md") && file !== "RECORD.md"
  );
  if (adrFiles.length === 0) {
    return "0001";
  }
  const lastAdrNumber = adrFiles.sort().slice(-1)[0].split("-")[0];
  const nextNumber = Number(lastAdrNumber) + 1;
  return nextNumber.toString().padStart(4, "0");
};

// Function to ask the user for the ADR name and if it supersedes another ADR
const promptUser = (adrDir) => {
  const prompts = [
    {
      type: "input",
      name: "adrName",
      message: "ADR Name (ex. use jest for testing): ",
    },
    {
      type: "confirm",
      name: "supersedes",
      message: "Does this ADR supersede another ADR?",
    },
    {
      type: "list",
      name: "supersededAdrFileName",
      message: "Select the ADR that this ADR supersedes: ",
      choices: fs
        .readdirSync(adrDir)
        .filter((file) => file.endsWith(".md") && file !== "RECORD.md"),
      when: (answers) =>
        answers.supersedes && fs.readdirSync(adrDir).length > 0,
    },
  ];
  return inquirer.prompt(prompts);
};

// Function to process the answers from the prompts
const processAnswers = (
  answers,
  adrTemplate,
  recordTemplate,
  adrDir,
  recordPath,
) => {
  const adrNumber = getNextAdrNumber(adrDir);
  const { adrName, supersededAdrFileName } = answers;
  // convert to kebab case for filename
  const adrNameKebabCase = adrName.replace(/\s+/g, "-").toLowerCase();
  // title case for record entry and adr h1
  const adrNameTitleCase = toTitleCase(adrName);
  const adrFileName = `${adrNumber}-${adrNameKebabCase}.md`;

  let supersedesNote = "";
  let supersededByNote = "";

  if (answers.supersedes) {
    supersedesNote = `- supersedes: [${supersededAdrFileName.replace(
      ".md",
      ""
    )}](./${supersededAdrFileName})`;
    supersededByNote = `- superseded by: [${adrName.toLowerCase()}](./${adrFileName})`;
  }

  const adrContent = adrTemplate
    .replace("{{adrTitleCase}}", adrNameTitleCase)
    .replace("{{supersedesNote}}", supersedesNote);
  fs.writeFileSync(`${adrDir}/${adrFileName}`, adrContent);

  const recordContent = recordTemplate
    .replace("{{adrTitleCase}}", adrNameTitleCase)
    .replace("{{adrFileName}}", adrFileName)
    .replace("{{supersedesNote}}", supersedesNote);
  fs.appendFileSync(recordPath, `${recordContent}`);

  if (answers.supersedes) {
    addSupersededByNote(
      supersededAdrFileName,
      supersededByNote,
      adrDir,
      recordPath
    );
  }
};

// Function to add the superseded by note to the superseded ADR and RECORD.md
const addSupersededByNote = (
  supersededAdrFileName,
  supersededByNote,
  adrDir,
  recordPath
) => {
  const scrubbedSupersededAdrFileName = supersededAdrFileName
    .replace(/\.md$/, "")
    .replace(/^\d{4}-/, "")
    .replace(/-/g, " ")
  // Add superseded by note to the superseded ADR and RECORD.md
  const supersededAdrFilePath = `${adrDir}/${supersededAdrFileName}`;
  fs.appendFileSync(supersededAdrFilePath, `${supersededByNote}`);

  // Add superseded by note to the existing entry of the superseded ADR in RECORD.md
  let recordContent = fs.readFileSync(recordPath, "utf-8");

  const supersededAdrRecordStart = recordContent.indexOf(
    `## [${toTitleCase(
      scrubbedSupersededAdrFileName
    )}](${supersededAdrFileName})`
  );

  // TODO: figure out better formatting here
  if (supersededAdrRecordStart !== -1) {
    const nextAdrRecordStart = recordContent.indexOf(
      "##",
      supersededAdrRecordStart + 1
    );
    const insertPosition =
      nextAdrRecordStart !== -1 ? nextAdrRecordStart : recordContent.length;
    recordContent =
      recordContent.slice(0, insertPosition) +
      `\n${supersededByNote}\n` +
      recordContent.slice(insertPosition);
    fs.writeFileSync(recordPath, recordContent);
  }
};

module.exports = {
  adrTemplate,
  recordTemplate,
  toTitleCase,
  createAdrFiles,
  addSupersededByNote,
  processAnswers,
  promptUser,
  getNextAdrNumber,
};