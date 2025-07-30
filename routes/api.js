import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Project from "../models/projects.js"
import Gallery from "../models/gallery.js";
import Blog from "../models/blogs.js";

dotenv.config();

const router = Router();

// Dummy user for example
const mockUser = {
  id: 1,
  email: "user@example.com",
  password: "password123", // NOTE: Replace with hashed password check in real apps
};

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ✅ Create Project (Image + Text + Gallery Images) with DB Save
router.post(
  "/create-project",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const { title } = req.body;
      const coverImage = req.files["coverImage"]?.[0]?.filename || null;
      const gallery = req.files["gallery"]?.map(file => file.filename) || [];

      const project = new Project({
        title,
        coverImage,
        gallery
      });

      const savedProject = await project.save();

      res.status(200).json({
        message: "Project created and saved successfully",
        project: savedProject
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to save project" });
    }
  }
);
router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }); // Most recent first
    res.status(200).json({ projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

router.get("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ project });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ message: "Failed to fetch project" });
  }
});


// ✅ Login Route with JWT
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === mockUser.email && password === mockUser.password) {
    const token = jwt.sign(
      { id: mockUser.id, email: mockUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful", 
      token,
      user: { id: mockUser.id, email: mockUser.email },
    });
  }

  return res.status(401).json({ message: "Invalid email or password" });
});
router.post("/gallery-upload", upload.array("gallery", 10), async (req, res) => {
  try {
    const imageFiles = req.files.map((file) => file.filename);

    const newGallery = new Gallery({
      images: imageFiles,
    });

    await newGallery.save();

    res.status(200).json({
      message: "Gallery images uploaded successfully!",
      images: imageFiles,
    });
  } catch (err) {
    console.error("Error uploading gallery:", err);
    res.status(500).json({ message: "Failed to upload gallery images" });
  }
});

router.post("/add-blog", upload.array("images", 5), async (req, res) => {
  try {
    const { title, content, author, category } = req.body;
    if (!title || !content || !author) {
      return res.status(400).json({ message: "Title, content, and author are required." });
    }

    // Handle uploaded images
    const imageFiles = req.files ? req.files.map((file) => file.filename) : [];

    const newBlog = new Blog({
      title,
      content,
      author,
      category,
      images: imageFiles,
    });

    await newBlog.save();
    res.status(201).json({
      message: "Blog added successfully!",
      blog: newBlog,
    });
  } catch (err) {
    console.error("Error adding blog:", err);
    res.status(500).json({ message: "Failed to add blog." });
  }
});
// ✅ Get all galleries
router.get("/galleries", async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json({ galleries });
  } catch (err) {
    console.error("Error fetching galleries:", err);
    res.status(500).json({ message: "Failed to fetch galleries" });
  }
});

// ✅ Get all blogs
router.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({ blogs });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});
router.get("/blogs/:id", async (req, res) => {
  try {
    const blogs = await Blog.findById(req.params.id);
    if (!blogs) {
      return res.status(404).json({ message: "blog not found" });
    }
    res.status(200).json({ blogs });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

export default router;
