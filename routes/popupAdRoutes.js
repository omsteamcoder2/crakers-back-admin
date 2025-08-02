import { Router } from "express";
import {
  addPopupAd,
  getAllPopupAds,
  updatePopupAd,
  deletePopupAd,
} from "../controllers/popupAdController.js";
import { upload, optimizeImage } from "../middleware/uploadMiddleware.js"; // ✅ include optimizeImage

const router = Router();

// ✅ Create Popup Ad
router.post(
  "/popupad",
  upload.fields([{ name: "image", maxCount: 1 }]),
  optimizeImage, // ✅ optimize after upload
  addPopupAd
);

// ✅ Get All Popup Ads
router.get("/popupad", getAllPopupAds);

// ✅ Update Popup Ad by ID
router.put(
  "/popupad/:id",
  upload.fields([{ name: "image", maxCount: 1 }]),
  optimizeImage, // ✅ optimize after upload
  updatePopupAd
);

// ✅ Delete Popup Ad by ID
router.delete("/popupad/:id", deletePopupAd);

export default router;
