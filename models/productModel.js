const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    productImages: [
      {
        imageUrl: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const productModel = model("Products", productSchema);

module.exports = productModel;
