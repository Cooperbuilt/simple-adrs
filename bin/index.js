#! /usr/bin/env node
const adrUtils = require('../src/index');

const {createAdrFiles, promptUser, processAnswers, adrTemplate, recordTemplate} = adrUtils;

// Main function to call all the other functions
const main = async () => {
  const adrDir = "./adr";
  const recordPath = "./adr/RECORD.md";
  createAdrFiles(adrDir, recordPath);
  const answers = await promptUser(adrDir);
  processAnswers(answers, adrTemplate, recordTemplate, adrDir, recordPath);
};

main().catch(console.error);
