"use strict";
const he = require("he");

const _ = require("lodash");
const images = require("./images");
const variations = require("./variations");
const request = require("request-promise");

//use for invetory
var BigCommerce = require("node-bigcommerce");

var bigCommerce = new BigCommerce({
  logLevel: "info",

  clientId: process.env.BC_CLIENT_ID,
  accessToken: process.env.BC_TOKEN,
  storeHash: "j7xmk1vwh",
  responseType: "json",
  apiVersion: "v3" // Default is v2
});

module.exports = async function(catalog) {
  //Fetch catalog from moltin that should have been already imported from feed

  //Imported data
  const productsImport = catalog.inventory;
  //Create product from import
  for (let product of productsImport) {
    if (
      product.visibility != "Not Visible Individually" &&
      product.image == ""
    ) {
      // CREATE product
      var productUpload = {
        name: product.name,
        price: product.price,
        categories: [24],
        weight: 1,
        type: "physical",
        sku: product.web_style_id,
        mpn: product.web_style_id,

        //for parent
        is_visible: false
      };

      const productOptions = {
        method: "POST",
        uri: `https://api.bigcommerce.com/stores/${process.env.BC_STORE}/v3/catalog/products`,
        headers: {
          accept: "application/json",
          "X-Auth-Client": process.env.BC_CLIENT_ID,
          "X-Auth-Token": process.env.BC_TOKEN
        },
        body: productUpload,
        json: true
      };

      //
      let productM = await request(productOptions);
      console.log("product created", productM.data.name);
    }
  }
};
