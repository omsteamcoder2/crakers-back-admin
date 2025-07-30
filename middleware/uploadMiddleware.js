import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Helper function to create directory if it doesn't exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Improved route detection for blog-related routes
    let baseFolder = "general";
    const url = req.originalUrl.toLowerCase();
    
    // Check for any blog-related routes
if (url.includes("project") || url.includes("projects")) {
      baseFolder = "projects";
    } else if (url.includes("gallery") || url.includes("galleries")) {
      baseFolder = "gallery";
    }

    let subFolder = "images"; // default fallback

    // Special folder rules for projects
    if (baseFolder === "projects") {
      if (file.fieldname === "coverImage") {
        subFolder = "cover-image";
      } else if (file.fieldname === "ogImage") {
        subFolder = "og-images";
      }
    } else {
      // For other base types (blogs, services...), keep og-images if present
      if (file.fieldname === "ogImage") {
        subFolder = "og-images";
      }
    }
    const dir = `./uploads/${baseFolder}/${subFolder}`;

    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}.webp`); // Always use .webp extension
  },
});

const multerUpload = multer({ storage });
export const upload = multerUpload;

export const optimizeImage = async (req, res, next) => {
  try {
    console.log("Files received by multer:", req.files);

    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    for (const fieldName in req.files) {
      const files = req.files[fieldName];
      
      for (const file of files) {
        const inputPath = file.path;
        const tempOutputPath = `${inputPath}.temp`;
        
        console.log(`Optimizing file: ${inputPath}`);
        
        try {
          // Get original file stats
          const originalStats = await fs.promises.stat(inputPath);
          console.log(`Original file size: ${originalStats.size} bytes`);

          // Process the image to temporary file
          await sharp(inputPath)
            .resize({
              width: 800,
              height: 800,
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({
              quality: 75,
              alphaQuality: 80,
              lossless: false,
              nearLossless: true,
              effort: 6,
              smartSubsample: true
            })
            .toFile(tempOutputPath);

          // Close the file handles by removing the original file reference
          file.stream?.destroy();
          
          // Try to delete the original file with retry logic
          await retryDelete(inputPath);
          
          // Rename temp file to original filename
          await fs.promises.rename(tempOutputPath, inputPath);

          // Get optimized file stats
          const optimizedStats = await fs.promises.stat(inputPath);
          console.log(`Optimized file size: ${optimizedStats.size} bytes`);
          console.log(`Reduction: ${Math.round((1 - optimizedStats.size/originalStats.size) * 100)}%`);

        } catch (err) {
          console.error(`Error processing file ${file.originalname}:`, err);
          
          // Clean up temp file if it exists
          await safeDelete(tempOutputPath);
          
          // If optimization fails, keep the original file
          continue;
        }
      }
    }

    next();
  } catch (err) {
    console.error("Error in optimizeImage middleware:", err);
    res.status(500).json({ message: "Failed to process image." });
  }
};

// Helper function with retry logic for file deletion
const retryDelete = async (filePath, retries = 3, delay = 100) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.promises.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Safe delete that won't throw if file doesn't exist
const safeDelete = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`Deleted temp file: ${filePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error deleting file ${filePath}:`, err);
    }
  }
};