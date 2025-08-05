import Order from "../models/orderModel.js";
import Product from "../models/productModel.js"; // Import Product Model

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { contact, products, packingCharges, total } = req.body;

    // No need to query the database, just directly use the values from the frontend
    const updatedProducts = products.map((product) => ({
      ...product,
      // These values should already be passed in the request body from the frontend
      boxQuantity: product.boxQuantity || null, 
      piecesPerBox: product.piecesPerBox || null,
    }));

    const newOrder = new Order({
      contact,
      products: updatedProducts,
      packingCharges,
      total,
      status: "pending", // Default order status
      payment: { status: "pending" }, // Default payment status
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({ message: "Order created successfully", order: savedOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// ✅ Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.status(200).json({ orders })
  } catch (err) {
    console.error("Error fetching orders:", err)
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

// ✅ Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: "Order not found" })

    res.status(200).json({ order })
  } catch (err) {
    console.error("Error fetching order:", err)
    res.status(500).json({ message: "Failed to fetch order" })
  }
}

// ✅ Update Order Status or Payment
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const update = {};
    if (status) update.status = status;
    if (paymentStatus) {
      update.payment = {
        status: paymentStatus,
        paidAt: paymentStatus === "paid" ? new Date() : null,
      };
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order updated", order: updated });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
};


// ✅ Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: "Order not found" })

    res.status(200).json({ message: "Order deleted successfully" })
  } catch (err) {
    console.error("Error deleting order:", err)
    res.status(500).json({ message: "Failed to delete order" })
  }
}
