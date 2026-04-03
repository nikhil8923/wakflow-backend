import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  service: String,
  status: { type: String, default: "new" },
   userId: String, 

  referredBy: String,   // referral code
  affiliateId: String,  // user who referred
   commission: { type: Number, default: 0 }, 

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Lead", leadSchema);