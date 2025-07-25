import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    slug: { type: String, required: true, unique: true, lowercase: true },
    metaTitle: String,
    metaDescription: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    keywords: [String],
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);

export default Service;
