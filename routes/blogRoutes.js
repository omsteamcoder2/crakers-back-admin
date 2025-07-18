import { Router } from "express";
import { addBlog, getBlogs, getBlogBySlug, updateBlogBySlug, deleteBlogBySlug } from "../controllers/blogControllers.js";
import { optimizeImage, upload } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post("/add-blog",
upload.fields([
  { name: "images", maxCount: 5 },
  { name: "ogImage", maxCount: 1 },
]),
optimizeImage, addBlog);
router.get("/blogs", getBlogs);
router.get('/blogs/:slug', getBlogBySlug);
router.put("/blogs/:slug", 
upload.fields([
  { name: "images", maxCount: 5 },
  { name: "ogImage", maxCount: 1 },
]),
optimizeImage,
updateBlogBySlug); // Update blog
router.delete("/blogs/:slug", deleteBlogBySlug); // Delete blog

export default router;