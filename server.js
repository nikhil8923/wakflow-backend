import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import leadRoutes from "./routes/lead.js";


app.use("/api", leadRoutes);

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port " + process.env.PORT);
});