import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  service: String,
  referredBy: String,
  affiliateId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  status: String,
  commission: Number
}, { timestamps: true });

export default mongoose.model("Lead", leadSchema);
