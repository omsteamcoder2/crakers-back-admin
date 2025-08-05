import { Router } from "express"
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js"

const router = Router()

// ✅ Create a new order
router.post("/orders", createOrder)

// ✅ Get all orders
router.get("/orders/getall", getAllOrders)

// ✅ Get a specific order by ID
router.get("/orders/:id", getOrderById)

// ✅ Update status/payment of an order
router.patch("/orders/:id", updateOrderStatus)

// ✅ Delete an order
router.delete("/orders/:id", deleteOrder)

export default router
