import Project from "../models/projects.js";
import fs from "fs";
import path from "path";
import slugify from "slugify";

const getRelativePath = (file) => {
  const absPath = file.path;
  const index = absPath.indexOf("uploads");
  if (index === -1) return null;

  const relative = absPath.substring(index).replace(/\\/g, "/");
    return "/" + relative;

};

// ✅ Create Project
export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage,
      keywords,
    } = req.body;

    const coverImage = req.files["coverImage"]?.[0] ? getRelativePath(req.files["coverImage"][0]) : null;
    const gallery = req.files["gallery"]?.map(getRelativePath) || [];

    const slug = slugify(title, { lower: true, strict: true });

    const ogImageFile = req.files["ogImage"]?.[0];
    const ogImagePath = ogImageFile ? getRelativePath(ogImageFile) : null;

    const ogImageValue = ogImagePath || coverImage || gallery[0] || "";

    const project = new Project({
      title,
      description,
      category,
      location,
      coverImage,
      gallery,
      slug,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage: ogImageValue,
      keywords: keywords?.split(",").map((k) => k.trim()),
    });

    const savedProject = await project.save();

    res.status(200).json({
      message: "Project created and saved successfully",
      project: savedProject,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save project" });
  }
};

// ✅ Get All Projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json({ projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// ✅ Get Project by Slug
export const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ project });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project" });
  }
};

// ✅ Update Project by Slug
export const updateProjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const updatedData = req.body;
    const keepGalleryImages = req.body.keepGalleryImages || [];
    const removeCoverImage = req.body.removeCoverImage === "true";

    const existingProject = await Project.findOne({ slug });
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    let imagesToDelete = [];

    // Handle cover image
    if (removeCoverImage) {
      if (existingProject.coverImage) {
        imagesToDelete.push(existingProject.coverImage);
      }
      updatedData.coverImage = null;
    } else {
      const newCoverImage = req.files["coverImage"]?.[0]?.filename;
      if (newCoverImage) {
        if (existingProject.coverImage) {
          imagesToDelete.push(existingProject.coverImage);
        }
        updatedData.coverImage = newCoverImage;
      } else {
        updatedData.coverImage = existingProject.coverImage;
      }
    }

    // Handle gallery images
    const galleryImagesToDelete = existingProject.gallery.filter(
      (img) => !keepGalleryImages.includes(img)
    );
    imagesToDelete = [...imagesToDelete, ...galleryImagesToDelete];

    const newGalleryImages = req.files["gallery"]?.map((file) => file.filename) || [];
    updatedData.gallery = [...keepGalleryImages, ...newGalleryImages];

    // Set default OG image if not explicitly provided
    if (!updatedData.ogImage) {
      updatedData.ogImage = updatedData.coverImage || updatedData.gallery[0] || "";
    }

    const updatedProject = await Project.findOneAndUpdate({ slug }, updatedData, {
      new: true,
    });

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    deleteImageFiles(imagesToDelete);

    res.status(200).json({ message: "Project updated successfully", project: updatedProject });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ message: "Failed to update project" });
  }
};

// ✅ Delete Project by Slug
export const deleteProjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const deletedProject = await Project.findOneAndDelete({ slug });
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    const imagesToDelete = [];
    if (deletedProject.coverImage) imagesToDelete.push(deletedProject.coverImage);
    if (deletedProject.gallery?.length) imagesToDelete.push(...deletedProject.gallery);

    deleteImageFiles(imagesToDelete);

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Failed to delete project" });
  }
};

function deleteImageFiles(filenames) {
  filenames.forEach((filename) => {
    try {
      // Check all possible folders for the file
      const folders = [
        'uploads/blogs/images',
        'uploads/blogs/og-images',
        'uploads/projects/images',
        'uploads/projects/og-images',
        'uploads/gallery/images',
        'uploads/gallery/og-images',
        'uploads/services/images',
        'uploads/services/og-images',
        'uploads' // fallback to root uploads
      ];

      for (const folder of folders) {
        const filePath = path.join(process.cwd(), folder, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
          break; // Stop checking after first successful deletion
        }
      }
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
    }
  });
}