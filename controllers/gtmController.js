// controllers/gtmTagController.js
import GtmTag from "../models/gtmModel.js";

// ✅ Create a GTM Tag
export const createGtmTag = async (req, res) => {
  try {
    const { name, location, content, isActive } = req.body;

    if (!name || !location || !content) {
      return res.status(400).json({ message: "Please fill all required fields: name, location, and content." });
    }

    const tag = new GtmTag({ name, location, content, isActive });
    const savedTag = await tag.save();

    res.status(201).json({ message: "GTM Tag created successfully.", tag: savedTag });
  } catch (error) {
    console.error("Error creating GTM Tag:", error);
    res.status(500).json({ message: "Something went wrong while creating the tag. Please try again later." });
  }
};

// ✅ Get Active GTM Tags by Location
export const getActiveGtmTags = async (req, res) => {
  try {
    const tags = await GtmTag.find({ isActive: true });

    const grouped = {
      head: [],
      body: [],
      footer: [],
    };

    tags.forEach(tag => {
      if (tag.location === "header") grouped.head.push(tag.content);
      else if (tag.location === "body") grouped.body.push(tag.content);
      else if (tag.location === "footer") grouped.footer.push(tag.content);
    });

    res.status(200).json(grouped);
  } catch (err) {
    console.error("Failed to load active GTM tags:", err);
    res.status(500).json({ message: "Failed to fetch GTM tags" });
  }
};

// ✅ Get all GTM Tags
export const getGtmTags = async (req, res) => {
  try {
    const tags = await GtmTag.find().sort({ createdAt: -1 });
    res.status(200).json({ tags });
  } catch (error) {
    console.error("Error fetching GTM Tags:", error);
    res.status(500).json({ message: "Unable to retrieve GTM tags. Please try again later." });
  }
};

// ✅ Get GTM Tag by ID
export const getGtmTagById = async (req, res) => {
  try {
    const tag = await GtmTag.findById(req.params.id);
    if (!tag) return res.status(404).json({ message: "GTM Tag not found." });

    res.status(200).json({ tag });
  } catch (error) {
    console.error("Error fetching GTM Tag by ID:", error);
    res.status(500).json({ message: "Unable to fetch GTM tag. Please check the ID and try again." });
  }
};

// ✅ Update GTM Tag
export const updateGtmTag = async (req, res) => {
  try {
    const { name, location, content, isActive } = req.body;
    const { id } = req.params;

    const updatedTag = await GtmTag.findByIdAndUpdate(
      id,
      { name, location, content, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedTag) {
      return res.status(404).json({ message: "GTM Tag not found." });
    }

    res.status(200).json({ message: "GTM Tag updated successfully.", tag: updatedTag });
  } catch (error) {
    console.error("Error updating GTM Tag:", error);
    res.status(500).json({ message: "Failed to update the GTM tag. Please try again." });
  }
};

// ✅ Delete GTM Tag
export const deleteGtmTag = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTag = await GtmTag.findByIdAndDelete(id);
    if (!deletedTag) {
      return res.status(404).json({ message: "GTM Tag not found." });
    }

    res.status(200).json({ message: "GTM Tag deleted successfully." });
  } catch (error) {
    console.error("Error deleting GTM Tag:", error);
    res.status(500).json({ message: "Unable to delete GTM tag. Please try again." });
  }
};