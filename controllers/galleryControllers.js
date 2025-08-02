import Gallery from "../models/gallery.js";
import path from "path";
import fs from "fs";

// Helper function to delete image files
// Enhanced helper function to delete image files with retry
const deleteImageFiles = async (filenames) => {
  for (const filename of filenames) {
    try {
      const basename = path.basename(filename);
      const filePath = path.join(process.cwd(), "uploads/gallery", basename);

      console.log("Trying to delete:", filePath);
      if (fs.existsSync(filePath)) {
        await retryDeleteWithBackoff(filePath);
      } else {
        console.warn("File does not exist:", filePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
    }
  }
};
// Retry-based deletion with exponential backoff for locked files
const retryDeleteWithBackoff = async (filePath, retries = 5, delay = 200) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Optional rename trick to break lock
      const tempPath = filePath + ".deleting";
      try {
        await fs.promises.rename(filePath, tempPath);
        await fs.promises.unlink(tempPath);
        console.log(`✅ Renamed & deleted locked file: ${filePath}`);
      } catch {
        await fs.promises.unlink(filePath);
        console.log(`✅ Deleted file: ${filePath}`);
      }
      return;
    } catch (err) {
      if (["EBUSY", "EPERM"].includes(err.code)) {
        console.warn(`⚠️ Locked (attempt ${i + 1}): ${filePath}`);
        await new Promise((res) => setTimeout(res, delay * (i + 1))); // exponential backoff
      } else if (err.code === "ENOENT") {
        console.warn(`⚠️ File already gone: ${filePath}`);
        return;
      } else {
        throw err;
      }
    }
  }
  console.error(`⛔ Failed to delete after retries: ${filePath}`);
};


// Create Gallery
export const uploadGallery = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category || !req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Category and at least one image are required" });
    }

    const imageFiles = Array.isArray(req.files.gallery)
      ? req.files.gallery.map(file => `/uploads/gallery/${file.filename}`)
      : [];

    const newGallery = new Gallery({
      category,
      images: imageFiles,
    });

    await newGallery.save();

    res.status(201).json({
      message: "Gallery created successfully!",
      gallery: newGallery
    });
  } catch (err) {
    console.error("Error creating gallery:", err);
    if (Array.isArray(req.files?.gallery) && req.files.gallery.length > 0) {
      await deleteImageFiles(req.files.gallery.map(file => file.filename));
    }
    res.status(500).json({ message: "Failed to create gallery" });
  }
};

// Get All Galleries
export const getGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json({ galleries });
  } catch (err) {
    console.error("Error fetching galleries:", err);
    res.status(500).json({ message: "Failed to fetch galleries" });
  }
};

// Get Gallery by ID
export const getGalleryById = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }
    res.status(200).json({ gallery });
  } catch (err) {
    console.error("Error fetching gallery:", err);
    res.status(500).json({ message: "Failed to fetch gallery" });
  }
};

// Update Gallery
export const updateGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, keepImages } = req.body;

    let imagesToKeep = [];
    try {
      imagesToKeep = typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages || [];
    } catch {
      imagesToKeep = [];
    }

    const existingGallery = await Gallery.findById(id);
    if (!existingGallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    const existingImages = existingGallery.images || [];
    const imagesToDelete = existingImages.filter(img => !imagesToKeep.includes(img));

    const newImageFiles = Array.isArray(req.files?.gallery)
      ? req.files.gallery.map(file => `/uploads/gallery/${file.filename}`
)
      : [];

    const allImages = [
      ...imagesToKeep,
      ...newImageFiles
    ];

    const updateData = {
      category: category || existingGallery.category,
      images: allImages,
      updatedAt: new Date(),
    };

    const updatedGallery = await Gallery.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedGallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    if (imagesToDelete.length > 0) {
      await deleteImageFiles(imagesToDelete);
    }

    res.status(200).json({ 
      message: "Gallery updated successfully", 
      gallery: updatedGallery 
    });
  } catch (err) {
    console.error("Error updating gallery:", err);
    if (Array.isArray(req.files?.gallery) && req.files.gallery.length > 0) {
      await deleteImageFiles(req.files.gallery.map(file => file.filename));
    }
    res.status(500).json({ message: "Failed to update gallery" });
  }
};

// Delete Gallery
export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGallery = await Gallery.findByIdAndDelete(id);
    if (!deletedGallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    if (deletedGallery.images?.length > 0) {
      await deleteImageFiles(deletedGallery.images);
    }

    res.status(200).json({ message: "Gallery deleted successfully" });
  } catch (err) {
    console.error("Error deleting gallery:", err);
    res.status(500).json({ message: "Failed to delete gallery" });
  }
};

// Delete Single Image from Gallery
export const deleteGalleryImage = async (req, res) => {
  try {
    const { galleryId, filename } = req.params;
    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    const imageIndex = gallery.images.findIndex(img => img.includes(filename));
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found in gallery" });
    }

    gallery.images.splice(imageIndex, 1);
    await gallery.save();
    await deleteImageFiles([filename]);

    res.status(200).json({
      message: "Image deleted successfully",
      gallery
    });
  } catch (err) {
    console.error("Error deleting gallery image:", err);
    res.status(500).json({ message: "Failed to delete image" });
  }
};
