import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,

  referralCode: String,
  referredBy: String,

  referrals: { type: Number, default: 0 },
  discount: { type: Number, default: 10 },
  earnings: { type: Number, default: 0 },

  plan: { type: String, default: "None" },
  planPrice: { type: Number, default: 0 },
  planType: { type: String, default: "onetime" }, // onetime / retainer
  planStatus: { type: String, default: "inactive" }, // inactive / active / completed
  deploymentStatus: { type: String, default: "pending" }, // pending / deployed
  retainer: { type: Boolean, default: false },
  retainerPrice: { type: Number, default: 0 },

  // ADD THESE TWO
  role: { type: String, default: "affiliate" }, // affiliate / admin
  resetOTP: Number,

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);