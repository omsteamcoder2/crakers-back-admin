
import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, default: "General" },
    images: [{ type: String }], // array of image filenames (optional)
    createdAt: { type: Date, default: Date.now },
    slug: {type: String,required: true,unique: true,lowercase: true},
    metaTitle: String,
    metaDescription: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    keywords: [String],
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);  

export default Blog;
