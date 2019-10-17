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
    //Now that all the children are made tie them to the parent
    if (
      product.visibility != "Not Visible Individually" &&
      product.image == ""
    ) {
      const getProductOptions = {
        method: "GET",
        uri: `https://api.bigcommerce.com/stores/${process.env.BC_STORE}/v3/catalog/products?sku=${product.web_style_id} `,
        headers: {
          accept: "application/json",
          "X-Auth-Client": process.env.BC_CLIENT_ID,
          "X-Auth-Token": process.env.BC_TOKEN
        },
        json: true
      };

      let parentID = await request(getProductOptions);
      if (isEmpty(parentID.data[0])) {
        //No parent should we make a parent
      } else {
        console.log("parentID.data.id", parentID.data[0].name);

        //add all the child to the parent now
        const getChildProducts = {
          method: "GET",
          uri: `https://api.bigcommerce.com/stores/${process.env.BC_STORE}/v3/catalog/products?mpn=${product.web_style_id} `,
          headers: {
            accept: "application/json",
            "X-Auth-Client": process.env.BC_CLIENT_ID,
            "X-Auth-Token": process.env.BC_TOKEN
          },
          json: true
        };
        let childIdField = await request(getChildProducts);

        const sibling = [];
        for (var i = 0; i < childIdField.data.length; i++) {
          var obj = childIdField.data[i];

          console.log(obj.id);
          //filter out the parent id
          if (obj.id != parentID.data[0].id) {
            sibling.push(obj.id);
          }
        }

        const customFieldsParent = {
          method: "POST",
          uri: `https://api.bigcommerce.com/stores/${
            process.env.BC_STORE
          }/v3/catalog/products/${parentID.data[0].id.toString()}/custom-fields`,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Auth-Client": process.env.BC_CLIENT_ID,
            "X-Auth-Token": process.env.BC_TOKEN
          },
          body: {
            name: "sibling_ids",
            value: sibling.toString() || "NONE"
          },
          json: true
        };

        let childIdCustomField = await request(customFieldsParent);
        console.log("siblingid added", childIdCustomField.data);
      }
      function isEmpty(obj) {
        return !obj || Object.keys(obj).length === 0;
      }
    }
  }
};
