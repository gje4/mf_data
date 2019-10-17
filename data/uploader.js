const fs = require("fs");
const csv = require("csv");
const argv = require("../argv");
const csvParser = require("csv-parser");

const readCsvToArray = function(file, columns) {
  // Pulling data out of the files
  const options = Object.assign({
    encoding: "UTF-8",
    delimiter: ",",
    rowDelimiter: "\r\n",
    strip: false,
    skip_lines_with_error: true,
    relax_column_count: true
  });

  return new Promise((resolve, reject) => {
    const result = [];

    fs.createReadStream(`${file}`, { encoding: options.encoding })
      .pipe(
        csv.parse({
          delimiter: options.delimiter,
          rowDelimiter: options.rowDelimiter,
          columns: true,
          skip_lines_with_error: options.skip_lines_with_error,
          relax_column_count: options.relax_column_count
        })
      )
      .on("data", function(row) {
        for (let attr of Object.keys(row).filter(k => !!row[k])) {
          if (options.strip) {
            row[attr] = row[attr].slice(0, -1);
          }
          row[attr] = row[attr].trim();
        }
        result.push(row);
      })
      .on("end", function() {
        console.log("Read %s objects from %s file", result.length, file);
        resolve(result);
      })
      .on("error", function(error) {
        console.log("Error parsing %s", file);
        reject(error);
      });
  });
};

module.exports = async function(path = ".") {
  //need to be able to take in the objects we want to use
  const [
    //objects in order of maps
    catalog
  ] = await Promise.all([
    //source data to parse
    readCsvToArray(`${path}`)
  ]);

  //The objects that are returned
  return {
    inventory: catalog
  };
};
