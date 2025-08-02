import Product from "../models/productModel.js";
import fs from "fs";
import path from "path";

const getRelativePath = (file) => {
  const absPath = file.path;
  const index = absPath.indexOf("uploads");
  if (index === -1) return null;
  return "/" + absPath.substring(index).replace(/\\/g, "/");
};

// ✅ Create Product
export const createProduct = async (req, res) => {
  try {
    const {
      productName,
      category,
      productCode,
      boxQuantity,
      piecesPerBox,
      price,
      isActive,
      offerPercentage,
      videoUrl,
      tags,
      seoTitle,
      metaDescription
    } = req.body;

    const image = req.files["image"]?.[0] ? getRelativePath(req.files["image"][0]) : null;

    const product = new Product({
      productName,
      category,
      productCode,
      boxQuantity,
      piecesPerBox,
      price,
      offerPercentage,
      image,
      videoUrl,
      tags: tags?.split(",").map(t => t.trim()),
      isActive: isActive ?? true,
      seoTitle,
      metaDescription
    });

    const savedProduct = await product.save();

    res.status(200).json({
      message: "Product created and saved successfully",
      product: savedProduct,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save product" });
  }
};

// ✅ Get All Products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ✅ Get Product by Product Code
export const getProductByCode = async (req, res) => {
  try {
    const product = await Product.findOne({ productCode: req.params.code });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ✅ Update Product by Code
export const updateProductByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const updateData = req.body;

// Clean numeric fields that may be empty strings or "null"
["boxQuantity", "piecesPerBox"].forEach((key) => {
  if (
    updateData[key] === "" ||
    updateData[key] === null ||
    updateData[key] === "null"
  ) {
    delete updateData[key]; // Remove invalid fields
  }
});

// Convert tags from string to array
if (typeof updateData.tags === "string") {
  updateData.tags = updateData.tags.split(",").map(t => t.trim());
}


    // Convert tags from string to array
    if (typeof updateData.tags === "string") {
      updateData.tags = updateData.tags.split(",").map(t => t.trim());
    }

    // Fetch the existing product to get the old image
    const existingProduct = await Product.findOne({ productCode: code });
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If a new image is uploaded, handle file and delete the old one
    if (req.files?.image?.[0]) {
      const newImage = getRelativePath(req.files.image[0]); // ✅ Use helper
      updateData.image = newImage;

      // Delete old image
      if (existingProduct.image) {
        const oldImageFullPath = path.join(process.cwd(), existingProduct.image.replace(/^\//, ""));
        try {
          await fs.promises.unlink(oldImageFullPath);
          console.log("✅ Old image deleted:", oldImageFullPath);
        }  catch (err) {
  console.error("Error updating product:", err); // Already here — but improve this:
  if (err.name === "CastError") {
    console.error("CastError details:", err);
  } else if (err.name === "ValidationError") {
    console.error("ValidationError details:", err.errors);
  } else {
    console.error("Unexpected Error:", err);
  }
  res.status(500).json({ message: "Failed to update product", error: err.message });
}

      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { productCode: code },
      updateData,
      { new: true }
    );

    res.status(200).json({ message: "Product updated", product: updatedProduct });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Failed to update product" });
  }
};


export const toggleProductStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const { isActive } = req.body;

    const updated = await Product.findOneAndUpdate(
      { productCode: code },
      { isActive },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Status updated", product: updated });
  } catch (err) {
    console.error("Failed to toggle product status:", err);
    res.status(500).json({ message: "Failed to toggle status" });
  }
};

// ✅ Delete Product by Code
export const deleteProductByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const deletedProduct = await Product.findOneAndDelete({ productCode: code });
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (deletedProduct.image) {
      await deleteImageFiles([deletedProduct.image]);
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

async function deleteImageFiles(paths) {
  for (const imagePath of paths) {
    const fullPath = path.join(process.cwd(), imagePath.replace(/^\//, ""));

    try {
      // Add a short wait before trying to delete
      await new Promise((res) => setTimeout(res, 100));

      // Ensure file is accessible before deleting
      await fs.promises.access(fullPath, fs.constants.F_OK | fs.constants.W_OK);

      await fs.promises.unlink(fullPath);
      console.log("✅ Deleted image:", fullPath);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn("⚠️ Image not found (already deleted):", fullPath);
      } else if (error.code === "EPERM" || error.code === "EACCES") {
        console.error("❌ File access issue (maybe locked):", fullPath);
      } else {
        console.error(`❌ Error deleting file ${fullPath}:`, error);
      }
    }
  }
}

