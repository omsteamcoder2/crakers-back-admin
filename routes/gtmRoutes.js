// routes/gtmTagRoutes.js
import { Router } from "express";
import {
  createGtmTag,
  getGtmTags,
  getGtmTagById,
  updateGtmTag,
    deleteGtmTag,
  getActiveGtmTags
} from "../controllers/gtmController.js";

const router = Router();

// Create a new GTM tag
router.post("/gtm-tags", createGtmTag);

// Get all GTM tags
router.get("/gtm-tags", getGtmTags);

// Get a GTM tag by ID
router.get("/gtm-tags/:id", getGtmTagById);

// Update a GTM tag
router.put("/gtm-tags/:id", updateGtmTag);

// Delete a GTM tag
router.delete("/gtm-tags/:id", deleteGtmTag);

router.get("/gtm-tags-live", getActiveGtmTags);

export default router;
