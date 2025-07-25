import Service from "../models/services.js";
import fs from "fs";
import path from "path";
import slugify from "slugify";

const getRelativePath = (file) => {
  const absPath = file.path;
  const index = absPath.indexOf("uploads");
  if (index === -1) return null;
  return "/" + absPath.substring(index).replace(/\\/g, "/");
};

// ✅ Add Service
export const addService = async (req, res) => {
  try {
    const {
      title,
      description,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      keywords,
    } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required." });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const imageFiles =
      req.files?.images?.map(
        (file) => `/uploads/services/images/${file.filename}`
      ) || [];

    const ogImageFile = req.files?.ogImage?.[0];
    const ogImagePath = ogImageFile
      ? getRelativePath(ogImageFile)
      : imageFiles[0] || "";

    const newService = new Service({
      title,
      description,
      slug,
      images: imageFiles,
      metaTitle,
      metaDescription,
      ogTitle: ogTitle || title,
      ogDescription: ogDescription || metaDescription,
      ogImage: ogImagePath,
      keywords: keywords?.split(",").map((k) => k.trim()),
    });

    await newService.save();
    res
      .status(201)
      .json({ message: "Service added successfully!", service: newService });
  } catch (err) {
    console.error("Error adding service:", err);
    res.status(500).json({ message: "Failed to add service." });
  }
};

// ✅ Get All Services
export const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.status(200).json({ services });
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

// ✅ Get Service by Slug
export const getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug });
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.status(200).json({ service });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch service" });
  }
};

export const updateServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const updatedData = req.body;

    let keepImages = [];
      try {
        const raw = req.body.keepImages;

        if (Array.isArray(raw)) {
          // If it's a JSON string in the first array element
          if (raw.length === 1 && typeof raw[0] === "string" && raw[0].startsWith("[")) {
            keepImages = JSON.parse(raw[0]);
          } else {
            keepImages = raw;
          }
        } else if (typeof raw === "string") {
          // A single JSON string
          keepImages = JSON.parse(raw);
        }
      } catch (e) {
        console.error("❌ Error parsing keepImages:", e);
        keepImages = [];
      }

      console.log("✅ Final keepImages:", keepImages);


    const existingService = await Service.findOne({ slug });
    if (!existingService) {
      return res.status(404).json({ message: "Service not found" });
    }

    const existingImages = existingService.images || [];

    const imagesToDelete = existingImages.filter(
      (img) => !keepImages.includes(img)
    );

    // ✅ Handle image uploads
    const newImageFiles =
      req.files?.images?.map(
        (file) => `/uploads/services/images/${file.filename}`
      ) || [];

    const finalImages = [
      ...existingImages.filter((img) => keepImages.includes(img)),
      ...newImageFiles,
    ];

    updatedData.images = finalImages;

    // ✅ Handle ogImage update logic (project-style)
    const uploadedOgImage = req.files?.ogImage?.[0];
    const manualOgImage = req.body.ogImage?.trim();

    if (uploadedOgImage) {
      updatedData.ogImage = getRelativePath(uploadedOgImage);
    } else if (manualOgImage) {
      updatedData.ogImage = manualOgImage;
    } else if (!existingService.ogImage) {
      updatedData.ogImage = finalImages[0] || "";
    } else {
      updatedData.ogImage = existingService.ogImage;
    }

    // ✅ Perform DB update
    const updatedService = await Service.findOneAndUpdate(
      { slug },
      updatedData,
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    // ✅ Delete unused images
    if (imagesToDelete.length > 0) {
      await deleteImageFiles(imagesToDelete);
    }

    res.status(200).json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (err) {
    console.error("Error updating service:", err);
    res.status(500).json({ message: "Failed to update service" });
  }
};

// ✅ Delete Service by Slug
export const deleteServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const deletedService = await Service.findOneAndDelete({ slug });

    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (deletedService.images?.length) {
      deleteImageFiles(deletedService.images);
    }

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("Error deleting service:", err);
    res.status(500).json({ message: "Failed to delete service" });
  }
};

// Helper: Delete image files with retries
async function deleteImageFiles(filenames) {
  for (const filename of filenames) {
    try {
      const basename = path.basename(filename);
      const folders = [
        "uploads/services/images",
        "uploads/services/og-images",
        "uploads",
      ];

      for (const folder of folders) {
        const filePath = path.join(process.cwd(), folder, basename);
        if (fs.existsSync(filePath)) {
          try {
            await retryDelete(filePath);
            break;
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
const retryDelete = async (filePath, retries = 5, delay = 250) => {
  for (let i = 0; i < retries; i++) {
    try {
      try { fs.closeSync(fs.openSync(filePath, 'r')); } catch {}
      await fs.promises.unlink(filePath);
      console.log(`✅ Deleted: ${filePath}`);
      return;
    } catch (err) {
      if (i === retries - 1) {
        console.warn(`⚠️ Skipped locked file: ${filePath}`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
