import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true, // This should be required if used for grouping
  },
  images: [
    {
      type: String,
      required: true, // Ensures each entry in the array is a valid image path
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Optional: Update `updatedAt` on every save
gallerySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Gallery = mongoose.model("Gallery", gallerySchema);

export default Gallery;
