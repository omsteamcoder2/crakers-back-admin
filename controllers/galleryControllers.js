import Gallery from "../models/gallery.js";
import path from "path";
import fs from "fs";

// Helper function to delete image files
async function deleteImageFiles(filenames) {
  for (const filename of filenames) {
    try {
      const basename = path.basename(filename);
      const folders = [
        'uploads/gallery/images',
        'uploads' // fallback
      ];

      for (const folder of folders) {
        const filePath = path.join(process.cwd(), folder, basename);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          break;
        }
      }
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
    }
  }
}

export const uploadGallery = async (req, res) => {
  try {
    const { title, description, category, metaTitle, metaDescription, keywords } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const imageFiles = Array.isArray(req.files.gallery)
      ? req.files.gallery.map(file => `/uploads/gallery/images/${file.filename}`)
      : [];

    const keywordArray = keywords ? keywords.split(',').map(k => k.trim()) : [];

    const newGallery = new Gallery({
      title,
      description,
      category,
      images: imageFiles,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || description?.substring(0, 160) || '',
      keywords: keywordArray
    });

    await newGallery.save();

    res.status(201).json({
      message: "Gallery created successfully!",
      gallery: newGallery
    });
  } catch (err) {
    console.error("Error creating gallery:", err);
    
    // Clean up uploaded files if there was an error
    if (req.files?.length > 0) {
      await deleteImageFiles(req.files.map(file => file.filename));
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ message: "A gallery with this title already exists" });
    }
    
    res.status(500).json({ message: "Failed to create gallery" });
  }
};

export const getGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json({ galleries });
  } catch (err) {
    console.error("Error fetching galleries:", err);
    res.status(500).json({ message: "Failed to fetch galleries" });
  }
};

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

export const updateGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, metaTitle, metaDescription, keywords, keepImages } = req.body;
    
    // Parse keepImages (could be stringified array or array)
    let imagesToKeep = [];
    try {
      imagesToKeep = typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages || [];
    } catch (e) {
      imagesToKeep = [];
    }

    const existingGallery = await Gallery.findById(id);
    if (!existingGallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    // Handle images
    const existingImages = existingGallery.images || [];
    const imagesToDelete = existingImages.filter(img => !imagesToKeep.includes(img));
    
    // Get new images (if any)
    const newImageFiles = Array.isArray(req.files?.gallery)
      ? req.files.gallery.map(file => `/uploads/gallery/images/${file.filename}`)
      : [];

    
    // Combine kept and new images
    const allImages = [
      ...existingImages.filter(img => imagesToKeep.includes(img)),
      ...newImageFiles
    ];

    // Prepare update data
    const updateData = {
      title: title || existingGallery.title,
      description: description || existingGallery.description,
      category: category || existingGallery.category,
      images: allImages,
      metaTitle: metaTitle || existingGallery.metaTitle,
      metaDescription: metaDescription || existingGallery.metaDescription,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : existingGallery.keywords,
      updatedAt: new Date()
    };

    const updatedGallery = await Gallery.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedGallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    // Delete old images that are no longer needed
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

export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedGallery = await Gallery.findByIdAndDelete(id);
    if (!deletedGallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    // Delete all associated image files
    if (deletedGallery.images?.length > 0) {
      await deleteImageFiles(deletedGallery.images);
    }

    res.status(200).json({ message: "Gallery deleted successfully" });
  } catch (err) {
    console.error("Error deleting gallery:", err);
    res.status(500).json({ message: "Failed to delete gallery" });
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    const { galleryId, filename } = req.params;

    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    // Check if image exists in gallery
    const imageIndex = gallery.images.findIndex(img => img.includes(filename));
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found in gallery" });
    }

    // Remove image from array
    gallery.images.splice(imageIndex, 1);
    await gallery.save();

    // Delete the file
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