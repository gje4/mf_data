"use strict";
const he = require("he");

const _ = require("lodash");
const images = require("./images");
const request = require("request-promise");
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
      // CREATE product
      var productUpload = {
        name: product.name,
        price: product.price,
        categories: [24],
        weight: 1,
        type: "physical",
        sku: product.sku,
        mpn: product.web_style_id,
        images: [
          {
            description: product.image_label,

            is_thumbnail: true,
            image_url: `https://www.ninewest.com/media/catalog/product/P/G/${product.image}`
          }
        ],
        upc: product.upc,
        is_visible: true
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

      // match based on sku and add parent id to custom fields web_style_id == product.web_style_id

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
        const customFieldsChild = {
          method: "POST",
          uri: `https://api.bigcommerce.com/stores/${process.env.BC_STORE}/v3/catalog/products/${productM.data.id}/custom-fields`,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Auth-Client": process.env.BC_CLIENT_ID,
            "X-Auth-Token": process.env.BC_TOKEN
          },
          body: {
            name: "parent_id",
            value: parentID.data[0].id.toString()
          },
          json: true
        };

        let parentIdField = await request(customFieldsChild);

        console.log("parentIdField", parentIdField.data);
      }
    }

    function isEmpty(obj) {
      return !obj || Object.keys(obj).length === 0;
    }
  }
};
