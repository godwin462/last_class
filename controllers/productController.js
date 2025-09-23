const cloudinary = require("../config/cloudinary");
const productModel = require("../models/productModel");
const fs = require("fs");

exports.createProduct = async (req, res) => {
  let files;
  try {
    const { productName } = req.body;
    files = req.files;
    let response = null;
    let productImages = [];

    if (files && files.length > 0) {
      productImages = await Promise.all(
        files.map(async (file) => {
          response = await cloudinary.uploader.upload(file.path);
          fs.unlinkSync(file.path);
          return {
            imageUrl: response?.secure_url,
            publicId: response?.public_id,
          };
        })
      );
    }

    const product = new productModel({
      productName,
      productImages,
    });
    await product.save();

    res.status(200).json({
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.log(error);
    if (files && files.length > 0) {
      for (const file of files) {
        fs.unlinkSync(file.path);
      }
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    res.status(200).json({
      message: "Product gotten successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  let files = null;
  try {
    // console.log(req);
    const { id } = req.params;
    const { productName } = req.body;
    files = req.files;

    const productToUpdate = await productModel.findById(id);
    if (!productToUpdate) {
      if (files && files.length > 0) {
        for (const file of files) {
          fs.unlinkSync(file.path);
        }
      }
      return res.status(404).json({
        message: "Product no found",
      });
    }

    if (files && files.length > 0) {
      productImages = await Promise.all(
        files.map(async (file) => {
          response = await cloudinary.uploader.upload(file.path);
          fs.unlinkSync(file.path);
          return {
            imageUrl: response?.secure_url,
            publicId: response?.public_id,
          };
        })
      );
      const oldImages = productToUpdate.productImages;

      for (const image of oldImages) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    const product = await productModel.findByIdAndUpdate(
      id,
      {
        productName,
        productImages,
      },
      { new: true }
    );
    res.status(200).json({
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productToUpdate = await productModel.findById(id);

    if (!productToUpdate) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const productImages = productToUpdate.productImages;
    for (const image of productImages) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    await productModel.findByIdAndDelete(id);
    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find().populate("productImages");

    res.status(200).json({
      total: products.length,
      message:
        products.length > 0
          ? "All products gotten successfully"
          : "No products found",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
