import { Router } from "express";
import { 
  uploadGallery, 
  getGalleries, 
  getGalleryById,
  updateGallery, 
  deleteGallery,
  deleteGalleryImage 
} from "../controllers/galleryControllers.js";
import { optimizeImage, upload } from "../middleware/uploadMiddleware.js";

const router = Router();

// Create gallery
router.post("/gallery-upload", 
  upload.fields([{ name: "gallery", maxCount: 10 }]),
  optimizeImage, 
  uploadGallery
);

// Get all galleries
router.get("/galleries", getGalleries);

// Get gallery by ID
router.get("/galleries/:id", getGalleryById);
// Update gallery
router.put("/galleries/:id", 
  upload.fields([{ name: "gallery", maxCount: 10 }]), 
  optimizeImage, 
  updateGallery
);

// Delete gallery
router.delete("/galleries/:id", deleteGallery);

// Delete specific image from gallery
router.delete("/galleries/:galleryId/images/:filename", deleteGalleryImage);

export default router;