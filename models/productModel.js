import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: String, required: true },
  productCode: { type: String, required: true, unique: true }, 

  boxQuantity: { type: String },
  piecesPerBox: { type: Number },
  price: { type: Number, required: true },
  offerPercentage: { type: Number, default: 0 },

  image: { type: String, required: true },
  videoUrl: { type: String },

  tags: [String],
  isActive: { type: Boolean, default: true },
  // SEO fields
  seoTitle: { type: String },
  metaDescription: { type: String },

}, {
  timestamps: true
});

const Product = mongoose.model("Product", productSchema);

export default Product;
