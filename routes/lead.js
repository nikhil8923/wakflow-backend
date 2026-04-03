import express from "express";
import Lead from "../models/Lead.js";
import User from "../models/User.js";

const router = express.Router();

// Create Lead
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

    // Increase affiliate lead count
    if (affiliate) {
      affiliate.totalLeads = (affiliate.totalLeads || 0) + 1;
      await affiliate.save();
    }

    res.json({ message: "Lead saved successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});


// Get leads for user dashboard (ONLY referred leads)
router.get("/leads/user/:userId", async (req, res) => {
  try {
    const leads = await Lead.find({ affiliateId: req.params.userId });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leads" });
  }
});


// Admin - Get all leads
router.get("/admin/leads", async (req, res) => {
  const leads = await Lead.find();
  res.json(leads);
});


// Admin - Update lead status
router.put("/admin/lead-status/:id", async (req, res) => {
  const { status } = req.body;
  await Lead.findByIdAndUpdate(req.params.id, { status });
  res.json({ message: "Status updated" });
});


// Admin - Convert lead and add commission
router.put("/admin/convert-lead/:id", async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.json({ message: "Lead not found" });

  lead.status = "converted";

  if (lead.affiliateId) {
    const user = await User.findById(lead.affiliateId);

    const commission = 5000;
    lead.commission = commission;

    user.earnings += commission;
    user.referrals += 1;
    user.totalClosedLeads = (user.totalClosedLeads || 0) + 1;

    await user.save();
  }

  await lead.save();

  res.json({ message: "Lead converted & commission added" });
});

export default router;