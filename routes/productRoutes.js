import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductByCode,
  updateProductByCode,
  deleteProductByCode,
  toggleProductStatus
} from "../controllers/productController.js";
import { optimizeImage, upload } from "../middleware/uploadMiddleware.js";

const router = Router();

// ✅ Create Product
router.post(
  "/create-product",
  upload.fields([
    { name: "image", maxCount: 1 },
  ]),
  optimizeImage,
  createProduct
);

// ✅ Get All Products
router.get("/products", getProducts);

// ✅ Get Product by productCode
router.get("/products/:code", getProductByCode);

// ✅ Update Product by productCode
router.put(
  "/products/:code",
  upload.fields([
    { name: "image", maxCount: 1 },
  ]),
  optimizeImage,
  updateProductByCode
);
router.patch("/products/:code/toggle-status", toggleProductStatus);
// ✅ Delete Product by productCode
router.delete("/products/:code", deleteProductByCode);

export default router;
