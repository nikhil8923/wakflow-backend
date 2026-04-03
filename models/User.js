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

  // Roles
  role: { type: String, default: "affiliate" }, // affiliate / admin

  // Password reset
  resetOTP: Number,

  // ===== ADD THESE FOR REFERRAL SYSTEM =====
  totalLeads: { type: Number, default: 0 },
  totalClosedLeads: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 10 }, // % commission
  wallet: { type: Number, default: 0 }, // withdrawable amount

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);