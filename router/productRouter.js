const {
    createProduct,
  deleteProduct,
  updateProduct,
  getAllProducts,
  getAProduct,
} = require("../controllers/productController");
const upload = require("../middleware/multer");

const productRouter = require("express").Router();

productRouter.put(
  "/product/:id",
  upload.array("productImages", 5),
  updateProduct
);

productRouter.post(
  "/product/",
  upload.array("productImages", 5),
    createProduct
);
productRouter.get("/products", getAllProducts);
productRouter.delete("/product/:id", deleteProduct);
productRouter.get("/product/:id", getAProduct);

module.exports = productRouter;
