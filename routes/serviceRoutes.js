import { Router } from "express";
import { addService, getServices, getServiceBySlug, updateServiceBySlug, deleteServiceBySlug } from "../controllers/serviceControllers.js";
import { upload, optimizeImage } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post(
  "/add-service",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "ogImage", maxCount: 1 },
  ]),
  optimizeImage,
  addService
);

router.get("/services", getServices);
router.get("/services/:slug", getServiceBySlug);
router.put(
  "/services/:slug",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "ogImage", maxCount: 1 },
  ]),
  optimizeImage,
  updateServiceBySlug
);
router.delete("/services/:slug", deleteServiceBySlug);

export default router;
