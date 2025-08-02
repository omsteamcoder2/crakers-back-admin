import Category from "../models/categoryModel.js";
import fs from "fs";
import path from "path";

const getRelativePath = (file) => {
  if (!file?.path) return null;
  const parts = file.path.split("uploads");
  if (parts.length < 2) return null;
  return `/uploads${parts[1].replace(/\\/g, "/")}`;
};


// Utility: Get full URL from relative path
const getFullImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `${process.env.BASE_URL}${filename}`;
};

// Utility: Delete image file from disk
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const imgPath = path.join(process.cwd(), "uploads", "categories", path.basename(imagePath));
  if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
};

// ✅ Create Category
export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const image = req.files?.image?.[0]
      ? getRelativePath(req.files.image[0])
      : null;

    const category = new Category({
      name: name.trim(),
      description: description?.trim() || "",
      image,
    });

    const savedCategory = await category.save();

    res.status(201).json({
  message: "Category created successfully",
  category: {
    ...savedCategory.toObject(),
    image: getFullImageUrl(savedCategory.image), // ✅ convert to full URL
  },
});

  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ message: "Failed to create category" });
  }
};

// ✅ Get All Categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    const formatted = categories.map((cat) => ({
      ...cat.toObject(),
      image: getFullImageUrl(cat.image),
    }));

    res.status(200).json({ categories: formatted });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// ✅ Update Category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { name, description, isActive, clearImage } = req.body;

    const updates = {
      name: name?.trim() || category.name,
      description: description?.trim() || category.description,
      isActive: isActive === "true" || isActive === true,
      updatedAt: Date.now(),
    };

    // Handle new image upload
    if (req.files?.image?.[0]) {
      deleteImageFile(category.image);
      updates.image = getRelativePath(req.files.image[0]);
    } else if (clearImage === "true" && category.image) {
      deleteImageFile(category.image);
      updates.image = null;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updates, {
      new: true,
    });

    res.status(200).json({
      message: "Category updated successfully",
      category: {
        ...updatedCategory.toObject(),
        image: getFullImageUrl(updatedCategory.image),
      },
    });
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Failed to update category" });
  }
};

// ✅ Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    deleteImageFile(category.image);
    await Category.findByIdAndDelete(id);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Failed to delete category" });
  }
};
