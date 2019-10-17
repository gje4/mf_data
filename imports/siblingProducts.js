"use strict";
const he = require("he");

const _ = require("lodash");
const images = require("./images");
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
  //Imported data
  const productsImport = catalog.inventory;
  //Create product from import
  for (let product of productsImport) {
    if (
      product.visibility != "Not Visible Individually" &&
      product.image != ""
    ) {
      //get productId
      const getProductOptions = {
        method: "GET",
        uri: `https://api.bigcommerce.com/stores/${process.env.BC_STORE}/v3/catalog/products?sku=${product.sku} `,
        headers: {
          accept: "application/json",
          "X-Auth-Client": process.env.BC_CLIENT_ID,
          "X-Auth-Token": process.env.BC_TOKEN
        },
        json: true
      };

      let productID = await request(getProductOptions);
      console.log("related id parent", productID.data[0].id);
      // match based on sku and add parent id to custom fields web_style_id == product.web_style_id
      const getRelatedProductOptions = {
        method: "GET",
        uri: `https://api.bigcommerce.com/stores/${process.env.BC_STORE}/v3/catalog/products?mpn=${product.web_style_id} `,
        headers: {
          accept: "application/json",
          "X-Auth-Client": process.env.BC_CLIENT_ID,
          "X-Auth-Token": process.env.BC_TOKEN
        },
        json: true
      };

      let relatedIds = await request(getRelatedProductOptions);
      if (isEmpty(relatedIds.data[0])) {
        //No parent should we make a parent
      } else {
        const relatedProducts = [];
        for (var i = 0; i < relatedIds.data.length; i++) {
          var obj = relatedIds.data[i];

          console.log(obj.id);
          //filter out the parent id
          if (obj.id != productID.data[0].id) {
            relatedProducts.push(obj.id);
          }
        }

        const customFieldsRelated = {
          method: "POST",
          uri: `https://api.bigcommerce.com/stores/${process.env.BC_STORE}/v3/catalog/products/${productID.data[0].id}/custom-fields`,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Auth-Client": process.env.BC_CLIENT_ID,
            "X-Auth-Token": process.env.BC_TOKEN
          },
          body: {
            name: "related_ids",
            value: relatedProducts.toString() || "NONE"
          },
          json: true
        };

        let relatedCustomField = await request(customFieldsRelated);
        console.log("related added", relatedCustomField.data);
      }
      function isEmpty(obj) {
        return !obj || Object.keys(obj).length === 0;
      }
    }
  }
};
