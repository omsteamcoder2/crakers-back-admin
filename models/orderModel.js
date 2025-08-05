import mongoose from "mongoose"

const orderSchema = new mongoose.Schema(
  {
    contact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },

    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        productName: { type: String, required: true },
        productCode: { type: String, required: true },
        price: { type: Number, required: true },
            quantity: { type: Number, required: true },
        boxQuantity: { type: String },
        piecesPerBox: { type: Number },
      },
    ],

    packingCharges: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    payment: {
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      paidAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
)

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema)

export default Order
