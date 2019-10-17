"use strict";

const fs = require("fs");
const argv = require("minimist")(process.argv.slice(2));

const importType = argv._[0];
var path;
if (fs.existsSync(importType)) {
  path = importType;
} else if (importType) {
  console.log(importType);
  path = importType;
} else if (!path || !fs.existsSync(importType)) {
  throw "Please specify a valid file system path or a site you wish to copy";
}

const isRequested = (arg, value) => {
  if (!value) {
    return argv[arg];
  }

  if (typeof argv[arg] === "string") {
    return argv[arg] === value;
  }

  if (Array.isArray(argv[arg])) {
    return argv[arg].includes(value);
  }

  return false;
};
module.exports = {
  path,
  clean: entity => isRequested("clean", entity),
  setup: argv.setup,
  skip: step => isRequested("skip", step)
};
