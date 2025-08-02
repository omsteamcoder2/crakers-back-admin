import PopupAd from "../models/popupAdModel.js";
import fs from "fs";
import path from "path";

// ✅ Convert image path to relative
const getRelativePath = (file) => {
  if (!file?.path) return null;
  const parts = file.path.split("uploads");
  if (parts.length < 2) return null;
  return `/uploads${parts[1].replace(/\\/g, "/")}`;
};

// ✅ Convert relative to full URL
const getFullImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `${process.env.BASE_URL}${filename}`;
};

// ✅ Delete popup ad image from disk
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const imgPath = path.join(process.cwd(), "uploads", "popupads", path.basename(imagePath));
  if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
};

// ✅ Create popup ad
export const addPopupAd = async (req, res) => {
  try {
    const image = req.files?.image?.[0] ? getRelativePath(req.files.image[0]) : null;

    if (!image) {
      return res.status(400).json({ message: "Popup ad image is required" });
    }

    const popupAd = new PopupAd({ image });
    const saved = await popupAd.save();

    res.status(201).json({
      message: "Popup ad created successfully",
      popupAd: {
        ...saved.toObject(),
        image: getFullImageUrl(saved.image),
      },
    });
  } catch (err) {
    console.error("Error creating popup ad:", err);
    res.status(500).json({ message: "Failed to create popup ad" });
  }
};

// ✅ Get all popup ads
export const getAllPopupAds = async (req, res) => {
  try {
    const popupAds = await PopupAd.find().sort({ createdAt: -1 });

    const formatted = popupAds.map((ad) => ({
      ...ad.toObject(),
      image: getFullImageUrl(ad.image),
    }));

    res.status(200).json({ popupAds: formatted });
  } catch (err) {
    console.error("Error fetching popup ads:", err);
    res.status(500).json({ message: "Failed to fetch popup ads" });
  }
};

// ✅ Update popup ad
export const updatePopupAd = async (req, res) => {
  try {
    const { id } = req.params;
    const popupAd = await PopupAd.findById(id);

    if (!popupAd) {
      return res.status(404).json({ message: "Popup ad not found" });
    }

    const { isActive, clearImage } = req.body;

    const updates = {
      isActive: isActive === "true" || isActive === true,
      updatedAt: Date.now(),
    };

    // ✅ Handle new image upload
    if (req.files?.image?.[0]) {
      deleteImageFile(popupAd.image);
      updates.image = getRelativePath(req.files.image[0]);
    } else if (clearImage === "true" && popupAd.image) {
      deleteImageFile(popupAd.image);
      updates.image = null;
    }

    const updated = await PopupAd.findByIdAndUpdate(id, updates, { new: true });

    res.status(200).json({
      message: "Popup ad updated successfully",
      popupAd: {
        ...updated.toObject(),
        image: getFullImageUrl(updated.image),
      },
    });
  } catch (err) {
    console.error("Error updating popup ad:", err);
    res.status(500).json({ message: "Failed to update popup ad" });
  }
};

// ✅ Delete popup ad
export const deletePopupAd = async (req, res) => {
  try {
    const { id } = req.params;
    const popupAd = await PopupAd.findById(id);

    if (!popupAd) {
      return res.status(404).json({ message: "Popup ad not found" });
    }

    deleteImageFile(popupAd.image);
    await PopupAd.findByIdAndDelete(id);

    res.status(200).json({ message: "Popup ad deleted successfully" });
  } catch (err) {
    console.error("Error deleting popup ad:", err);
    res.status(500).json({ message: "Failed to delete popup ad" });
  }
};
