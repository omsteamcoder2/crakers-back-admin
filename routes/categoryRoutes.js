import { Router } from "express";
import {
  addCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

// ✅ Create Category
router.post(
  "/category",
  upload.fields([{ name: "image", maxCount: 1 }]),
  addCategory
);

// ✅ Get All Categories
router.get(
  "/category",
  getAllCategories
);

// ✅ Update Category by ID
router.put(
  "/category/:id",
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateCategory
);

// ✅ Delete Category by ID
router.delete(
  "/category/:id",
  deleteCategory
);

export default router;
