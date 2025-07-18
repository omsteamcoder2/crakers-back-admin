import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import mongoose from "mongoose";
import loggerMiddleware from "./middleware/loggerMiddleware.js";

dotenv.config();

const app = express();


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Failed to connect to MongoDB:", err.message));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(loggerMiddleware); // Use the logger middleware

app.use("/api", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", galleryRoutes);
app.use("/api", blogRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});