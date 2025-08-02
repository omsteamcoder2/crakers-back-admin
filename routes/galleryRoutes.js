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

/**
 * @route   POST /api/gallery-upload
 * @desc    Upload new gallery with multiple images
 * @access  Admin
 */
router.post(
  "/gallery-upload", 
  upload.fields([{ name: "gallery", maxCount: 10 }]),  // Accept up to 10 images from field "gallery"
  optimizeImage, 
  uploadGallery
);

/**
 * @route   GET /api/galleries
 * @desc    Get all galleries
 * @access  Public
 */
router.get("/galleries", getGalleries);

/**
 * @route   GET /api/galleries/:id
 * @desc    Get a gallery by ID
 * @access  Public
 */
router.get("/galleries/:id", getGalleryById);

/**
 * @route   PUT /api/galleries/:id
 * @desc    Update an existing gallery (with optional image upload)
 * @access  Admin
 */
router.put(
  "/galleries/:id", 
  upload.fields([{ name: "gallery", maxCount: 10 }]), 
  optimizeImage,
  updateGallery
);

/**
 * @route   DELETE /api/galleries/:id
 * @desc    Delete a gallery by ID
 * @access  Admin
 */
router.delete("/galleries/:id", deleteGallery);

/**
 * @route   DELETE /api/galleries/:galleryId/images/:filename
 * @desc    Delete specific image from a gallery
 * @access  Admin
 */
router.delete("/galleries/:galleryId/images/:filename", deleteGalleryImage);

export default router;
