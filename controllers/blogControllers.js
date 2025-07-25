import Blog from "../models/blogs.js";
import fs from "fs";
import path from "path";
import slugify from "slugify";

// ✅ Create Blog
export const addBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      category,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      keywords,
    } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ message: "Title, content, and author are required." });
    }

    // Determine base folder from request URL
    let baseFolder = "general";
    if (req.originalUrl.includes("blog") || req.originalUrl.includes("blogs")) {
      baseFolder = "blogs";
    }

    // Create paths for images
    const imageFiles = req.files?.images ? req.files.images.map(file => 
      `/uploads/${baseFolder}/images/${file.filename}`
    ) : [];
    
    const ogImageFile = req.files?.ogImage?.[0]?.filename;
    const ogImage = ogImageFile ? 
      `/uploads/${baseFolder}/og-images/${ogImageFile}` : 
      (imageFiles.length > 0 ? imageFiles[0] : '');

    const slug = slugify(title, { lower: true, strict: true });

    const newBlog = new Blog({
      title,
      content,
      author,
      category,
      slug,
      images: imageFiles,
      metaTitle,
      metaDescription,
      ogTitle: ogTitle || title,
      ogDescription: ogDescription || metaDescription,
      ogImage,
      keywords: keywords?.split(",").map((k) => k.trim()),
    });
    
    await newBlog.save();
    res.status(201).json({ message: "Blog added successfully!", blog: newBlog });
  } catch (err) {
    console.error("Error adding blog:", err);
    res.status(500).json({ message: "Failed to add blog." });
  }
};


// ✅ Get All Blogs
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({ blogs });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

// ✅ Get Blog by Slug
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.status(200).json({ blog });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blog" });
  }
};

export const updateBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const updatedData = req.body;
    
    // Determine base folder from request URL
    let baseFolder = "general";
    if (req.originalUrl.includes("blog") || req.originalUrl.includes("blogs")) {
      baseFolder = "blogs";
    }

    let keepImages = [];
    try {
      const raw = req.body.keepImages;
      if (Array.isArray(raw)) {
        keepImages = raw;
      } else if (typeof raw === "string") {
        keepImages = JSON.parse(raw);
      }
    } catch (err) {
      console.error("Failed to parse keepImages:", err);
      keepImages = [];
    }


    const existingBlog = await Blog.findOne({ slug });
    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Handle regular images - extract just filenames for comparison
    const existingImages = existingBlog.images || [];
    const existingImageFilenames = existingImages.map(img => path.basename(img));
    
    const imagesToDelete = existingImages.filter(img => !keepImages.includes(img));

    
    // Get new images (if any) with full paths
    const newImageFiles = req.files?.images 
      ? req.files.images.map(file => `/uploads/${baseFolder}/images/${file.filename}`)
      : [];
    
    // Combine kept images (filter existing ones based on keepImages) and new images
    const allImages = [
      ...existingImages.filter(img => keepImages.includes(img)),
      ...newImageFiles
    ];

    let ogImage;

    if (req.files?.ogImage?.[0]) {
      // ✅ New ogImage uploaded
      ogImage = `/uploads/${baseFolder}/og-images/${req.files.ogImage[0].filename}`;
    } else if (existingBlog.ogImage && allImages.includes(existingBlog.ogImage)) {
      // ✅ Keep previous ogImage if still present in image list
      ogImage = existingBlog.ogImage;
    } else {
      // ✅ Fallback: use first available image
      ogImage = allImages.length > 0 ? allImages[0] : "";
    }


    updatedData.images = allImages;
    updatedData.ogImage = ogImage;

    const updatedBlog = await Blog.findOneAndUpdate(
      { slug },
      updatedData,
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete old images that are no longer needed
    if (imagesToDelete.length > 0) {
      await deleteImageFiles(imagesToDelete);
    }

    res.status(200).json({ 
      message: "Blog updated successfully", 
      blog: updatedBlog 
    });
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: "Failed to update blog" });
  }
};

// ✅ Delete Blog by Slug
export const deleteBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const deletedBlog = await Blog.findOneAndDelete({ slug });

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (deletedBlog.images?.length) {
      deleteImageFiles(deletedBlog.images);
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ message: "Failed to delete blog" });
  }
};

// Improved deleteImageFiles function with async/await and retry logic
async function deleteImageFiles(filenames) {
  for (const filename of filenames) {
    try {
      const basename = path.basename(filename);
      const folders = [
        'uploads/blogs/images',
        'uploads/blogs/og-images',
        'uploads/projects/images',
        'uploads/projects/og-images',
        'uploads/gallery/images',
        'uploads/gallery/og-images',
        'uploads/services/images',
        'uploads/services/og-images',
        'uploads'
      ];

      for (const folder of folders) {
        const filePath = path.join(process.cwd(), folder, basename);
        if (fs.existsSync(filePath)) {
          try {
            await retryDelete(filePath);
            break; // Stop checking after successful deletion
          } catch (err) {
            console.error(`Error deleting file ${filePath}:`, err);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
    }
  }
}

// Retry deletion helper
const retryDelete = async (filePath, retries = 3, delay = 100) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.promises.unlink(filePath);
      console.log(`Successfully deleted: ${filePath}`);
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};