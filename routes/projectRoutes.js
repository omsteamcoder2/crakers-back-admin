import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectBySlug,
  updateProjectBySlug,
  deleteProjectBySlug,
} from "../controllers/projectController.js";
import { optimizeImage, upload } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post(
  "/create-project",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "ogImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  optimizeImage,
  createProject
);

router.get("/projects", getProjects);
router.get("/projects/:slug", getProjectBySlug);

router.put(
  "/projects/:slug",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "ogImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  optimizeImage,
  updateProjectBySlug
);

router.delete("/projects/:slug", deleteProjectBySlug);

export default router;
