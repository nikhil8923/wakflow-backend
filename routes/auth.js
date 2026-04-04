import express from "express";
import User from "../models/User.js";
import Lead from "../models/Lead.js";
import Analytics from "../models/Analytics.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();


// ================= SIGNUP =================
router.post("/signup", async (req, res) => {
  const { name, email, password, referralCode, phone } = req.body;

  try {
    const nameRegex = /^[A-Za-z ]{3,}$/;
    if (!nameRegex.test(name)) {
      return res.json({ message: "Name must contain only letters and min 3 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({ message: "Invalid email format" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.json({
        message: "Password must be 8+ chars with uppercase, lowercase, number & special character"
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const namePart = name.substring(0, 4).toUpperCase();
    const discount = Math.floor(Math.random() * 30) + 10;
    const myReferralCode = namePart + discount;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      referralCode: myReferralCode,
      referredBy: referralCode || null,
      referrals: 0,
      discount: discount,
      earnings: 0,
      role: "affiliate"
    });

    await user.save();

    // Referral reward (FIXED - moved inside route)
    if (referralCode) {
      const refUser = await User.findOne({ referralCode: referralCode });
      if (refUser) {
        refUser.referrals += 1;
        refUser.earnings += 100;
        await refUser.save();
      }
    }

    // Send email in background
    sendEmail(
      email,
      "Welcome to Wakflow 🚀",
      `Hello ${name},

Your referral code: ${myReferralCode}
Your discount: ${discount}%

Login here:
https://wakflow.com/auth/login.html

- Team Wakflow`
    ).catch(err => console.log("Email error:", err));

    return res.json({
      message: "Signup successful",
      referralCode: myReferralCode,
      discount: discount
    });

  } catch (error) {
    console.log("Signup error:", error);
    return res.status(500).json({ message: "Signup error" });
  }
});

  


// LOGIN 
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secret123",
      { expiresIn: "1d" }
    );

    // IMPORTANT: Added referralCode in response
    res.json({
      token: token,
      userId: user._id,
      role: user.role,
      referralCode: user.referralCode
    });

  } catch (error) {
    console.log(error);
    res.json({ message: "Login error" });
  }
});


// ================= CREATE LEAD =================
router.post("/lead", async (req, res) => {
  try {
    const { name, email, phone, service, referralCode, userId } = req.body;

    let affiliate = null;
    if (referralCode) {
      affiliate = await User.findOne({ referralCode: referralCode });
    }

    const lead = new Lead({
      name,
      email,
      phone,
      service,
      referredBy: referralCode || null,
      affiliateId: affiliate ? affiliate._id : null,
      userId: userId || null,
      status: "new"
    });

    await lead.save();

    if (affiliate) {
      affiliate.totalLeads = (affiliate.totalLeads || 0) + 1;
      await affiliate.save();
    }

    res.json({ message: "Lead saved successfully" });

  } catch (error) {
    console.log("Lead Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= ADMIN ALL LEADS =================
router.get("/admin/leads", async (req, res) => {
  const leads = await Lead.find();
  res.json(leads);
});


// ================= UPDATE LEAD STATUS =================
router.put("/admin/lead-status/:leadId", async (req, res) => {
  const { status } = req.body;
  await Lead.findByIdAndUpdate(req.params.leadId, { status });
  res.json({ message: "Lead status updated" });
});


// ================= CONVERT LEAD =================
router.put("/admin/convert-lead/:id", async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.json({ message: "Lead not found" });

  lead.status = "converted";

  if (lead.affiliateId) {
    const user = await User.findById(lead.affiliateId);

    const commission = 5000;
    lead.commission = commission;

    user.referrals += 1;
    user.earnings += commission;
    user.totalClosedLeads = (user.totalClosedLeads || 0) + 1;

    await user.save();
  }

  await lead.save();

  res.json({ message: "Lead converted & commission added" });
});

// ===================== DASHBOARD =====================
router.get("/dashboard/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.json({
        name: "",
        referralCode: "",
        discount: 0,
        referrals: 0,
        conversionRate: 0,
        earnings: 0,
        leads: []
      });
    }

    const leads = await Lead.find({ referredBy: user.referralCode });

    const conversions = leads.filter(l => l.status === "converted").length;
    const earnings = leads.reduce((sum, l) => sum + (l.commission || 0), 0);

    res.json({
      name: user.name || "",
      referralCode: user.referralCode || "",
      discount: user.discount || 0,
      referrals: leads.length || 0,
      conversionRate: leads.length
        ? ((conversions / leads.length) * 100).toFixed(1)
        : 0,
      earnings: earnings || 0,
      leads: leads || []
    });

  } catch (err) {
    console.log("Dashboard error:", err);
    res.json({
      name: "",
      referralCode: "",
      discount: 0,
      referrals: 0,
      conversionRate: 0,
      earnings: 0,
      leads: []
    });
  }
});
// ================= GET USER LEADS =================
router.get("/leads/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.json([]);

    // Find leads referred by this user
    const leads = await Lead.find({ referredBy: user.referralCode })
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (err) {
    console.log("Error fetching user leads:", err);
    res.json([]);
  }
});

  
export default router;