import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  userId: String,
  date: String,
  leads: Number,
  conversions: Number,
  revenue: Number
});

export default mongoose.model("Analytics", analyticsSchema);