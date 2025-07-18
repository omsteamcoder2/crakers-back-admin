import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  coverImage: String,
  category: String,
  location: String,
  gallery: [String],
  slug: {type: String,required: true,unique: true,lowercase: true},
  metaTitle: String,
  metaDescription: String,
  ogTitle: String,
  ogDescription: String,
  ogImage: String,
  keywords: [String],
}, { timestamps: true });

const Project = mongoose.model("Project", projectSchema);

export default Project;
