// models/gtmTag.js
import mongoose from "mongoose";

const gtmTagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, enum: ["header", "body", "footer"], required: true },
  content: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const GtmTag = mongoose.model("GtmTag", gtmTagSchema);
export default GtmTag;
