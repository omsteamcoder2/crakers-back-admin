import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Helper to ensure a directory exists
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let baseFolder = "general";
    const url = req.originalUrl.toLowerCase();

    if (url.includes("product")) {
  baseFolder = "products";
} else if (url.includes("gallery")) {
  baseFolder = "gallery";
} else if (url.includes("category")) {
  baseFolder = "categories";
} else if (url.includes("popupad")) {
  baseFolder = "popupads";
}
    const dir = path.join("uploads", baseFolder);
    ensureDirectoryExists(dir);
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}.webp`);
  },
});

// Export multer instance
const multerUpload = multer({ storage });
export const upload = multerUpload;

// Optimize uploaded image middleware
export const optimizeImage = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    for (const fieldName in req.files) {
      const files = req.files[fieldName];

      for (const file of files) {
        const inputPath = file.path;

        if (!file.mimetype.startsWith("image/")) continue;

        try {
          const originalStats = await fs.promises.stat(inputPath);
          console.log(
            `🔧 Optimizing ${file.originalname} (${originalStats.size} bytes)`
          );

          const optimizedBuffer = await sharp(inputPath)
            .resize({
              width: 800,
              height: 800,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({
              quality: 40,
              alphaQuality: 60,
              lossless: false,
              nearLossless: false,
              effort: 4,
            })
            .withMetadata({}) // strip EXIF/ICC metadata
            .toBuffer();
          // Create unique temporary file in destination directory
          const tempPath = path.join(
            path.dirname(inputPath),
            `temp-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 15)}.webp`
          );
          // Write optimized image to temp file
          await fs.promises.writeFile(tempPath, optimizedBuffer);
          // Replace original with optimized file
          await retryRename(tempPath, inputPath);

          const optimizedStats = await fs.promises.stat(inputPath);
          const reduction = Math.round(
            (1 - optimizedStats.size / originalStats.size) * 100
          );
          console.log(
            `✅ Optimized ${file.originalname} (${optimizedStats.size} bytes, ${reduction}% reduction)`
          );
        } catch (err) {
          console.error(`❌ Failed to optimize ${file.originalname}:`, err);
        }
      }
    }
    next();
  } catch (err) {
    console.error("❌ Error in optimizeImage middleware:", err);
    res.status(500).json({ message: "Failed to process image." });
  }
};

// Enhanced retry logic for Windows file locking
const retryRename = async (source, target, retries = 10, delay = 300) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.promises.rename(source, target);
      return;
    } catch (err) {
      if (["EPERM", "EBUSY", "EACCES"].includes(err.code)) {
        console.warn(
          `⚠️ File locked (attempt ${attempt}/${retries}): ${target}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      } else {
        // Cleanup temp file on unexpected errors
        try {
          await fs.promises.unlink(source);
        } catch {}
        throw err;
      }
    }
  }

  // Final cleanup after failed attempts
  try {
    await fs.promises.unlink(source);
  } catch {}
  throw new Error(
    `Failed to rename after ${retries} attempts: ${source} → ${target}`
  );
};
