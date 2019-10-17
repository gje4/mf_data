"use strict";

process.on("unhandledRejection", reason => console.error(reason));
const uploader = require("./data/uploader");
const childProducts = require("./imports/childProducts");
const argv = require("./argv");
const products = require("./imports/products");
const siblingProducts = require("./imports/siblingProducts");
const relationshipProducts = require("./imports/relationshipProducts");

require("dotenv").load();

(async function() {
  //Delete only what is passed to delete

  //setup the upload object
  const catalog = await uploader(argv.path);

  //create parent
  await products(catalog);
  //create sibilings
  await childProducts(catalog);
  //now that all product are made add the siblin id to the parent
  await siblingProducts(catalog);

  //now that all product are made add the siblinig to sibling
  await relationshipProducts(catalog);

  //Add sibiling id to parent
  await parentIDProducts(catalog);

  console.log("New  catalog is ready to go");
})();
