import mongoose from "mongoose";

const popupAdSchema = new mongoose.Schema({
  image: { type: String, required: true }, // path or URL to the ad image
  isActive: { type: Boolean, default: true }, // whether the popup should be shown
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt before save
popupAdSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.PopupAd || mongoose.model("PopupAd", popupAdSchema);
