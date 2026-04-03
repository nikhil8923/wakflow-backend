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
    if (userExists) return res.json({ message: "User already exists" });

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

    // Send welcome email
    await sendEmail(
      email,
      "Welcome to Wakflow 🚀",
      `Hello ${name},

Welcome to Wakflow Automations.

Your referral code: ${myReferralCode}
Your discount: ${discount}%

Login here:
https://wakflow.com/login.html

- Team Wakflow`
    );

    // Referral reward
    if (referralCode) {
      const refUser = await User.findOne({ referralCode: referralCode });
      if (refUser) {
        refUser.referrals += 1;
        refUser.earnings += 100;
        await refUser.save();

        await sendEmail(
          refUser.email,
          "You Got a New Referral 🎉",
          `Someone signed up using your referral code.
You earned ₹100.`
        );

        const today = new Date().toISOString().slice(0, 10);

        const analytics = new Analytics({
          userId: refUser._id,
          date: today,
          leads: 1,
          conversions: 1,
          revenue: 100
        });

        await analytics.save();
      }
    }

    res.json({
      message: "Signup successful",
      referralCode: myReferralCode,
      discount: discount
    });

  } catch (error) {
    console.log(error);
    res.json({ message: "Signup error" });
  }
});


// ================= LOGIN =================
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

    res.json({
      token: token,
      userId: user._id,
      role: user.role
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
      status: "new",
      commission: 0
    });

    await lead.save();

    if (affiliate) {
      await sendEmail(
        affiliate.email,
        "New Lead Received - Wakflow",
        `You received a new lead:

Name: ${name}
Email: ${email}
Phone: ${phone}
Service: ${service}`
      );
    }

    res.json({ message: "Lead saved successfully" });

  } catch (error) {
    console.log("Lead Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= USER DASHBOARD DATA =================
router.get("/dashboard/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);

  res.json({
    referralCode: user.referralCode,
    discount: user.discount,
    referrals: user.referrals,
    earnings: user.earnings
  });
});


// ================= USER LEADS FOR DASHBOARD =================
router.get("/dashboard/leads/:userId", async (req, res) => {
  try {
    const leads = await Lead.find({ affiliateId: req.params.userId });
    res.json(leads);
  } catch (error) {
    res.json({ message: "Error fetching leads" });
  }
});


// ================= ADMIN STATS =================
router.get("/admin/stats", async (req, res) => {
  const users = await User.find();
  const leads = await Lead.find();

  res.json({
    totalUsers: users.length,
    totalLeads: leads.length,
    totalReferrals: users.reduce((sum, u) => sum + (u.referrals || 0), 0),
    totalEarnings: users.reduce((sum, u) => sum + (u.earnings || 0), 0)
  });
});


// ================= ADMIN ALL USERS =================
router.get("/admin/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
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
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.json({ message: "Lead not found" });

    lead.status = "converted";
    lead.commission = 5000;
    await lead.save();

    if (lead.affiliateId) {
      const user = await User.findById(lead.affiliateId);
      user.referrals += 1;
      user.earnings += 5000;
      await user.save();
    }

    res.json({ message: "Lead converted & commission added" });

  } catch (error) {
    res.json({ message: "Error converting lead" });
  }
});

export default router;