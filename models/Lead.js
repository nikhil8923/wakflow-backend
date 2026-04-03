import express from "express";
import Lead from "../models/Lead.js";
import User from "../models/User.js";

const router = express.Router();


// ================= SAVE LEAD =================
router.post("/send-lead", async (req, res) => {
  try {
    const { name, email, phone, service, referralCode, userId } = req.body;

    let affiliate = null;

    // Find affiliate using referral code
    if (referralCode) {
      affiliate = await User.findOne({ referralCode: referralCode });
    }

    const lead = new Lead({
      name,
      email,
      phone,
      service,
      userId: userId || null,
      referredBy: referralCode || null,
      affiliateId: affiliate ? affiliate._id : null,
      status: "new",
      commission: 0
    });

    await lead.save();

    // Increase affiliate total leads
    if (affiliate) {
      affiliate.totalLeads = (affiliate.totalLeads || 0) + 1;
      await affiliate.save();
    }

    res.status(200).json({ message: "Lead saved successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error saving lead" });
  }
});


// ================= GET ALL LEADS (ADMIN) =================
router.get("/leads", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Error fetching leads" });
  }
});


// ================= GET LEADS FOR USER DASHBOARD =================
router.get("/leads/user/:userId", async (req, res) => {
  try {
    const leads = await Lead.find({ affiliateId: req.params.userId });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user leads" });
  }
});


// ================= UPDATE LEAD STATUS =================
router.put("/leads/status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    await Lead.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "Lead status updated" });
  } catch (error) {
    res.status(500).json({ error: "Error updating status" });
  }
});


// ================= CONVERT LEAD =================
router.put("/leads/convert/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.json({ message: "Lead not found" });

    lead.status = "converted";

    // Add commission to affiliate
    if (lead.affiliateId) {
      const user = await User.findById(lead.affiliateId);

      const commission = 5000; // Change later if needed
      lead.commission = commission;

      user.earnings += commission;
      user.referrals += 1;
      user.totalClosedLeads = (user.totalClosedLeads || 0) + 1;

      await user.save();
    }

    await lead.save();

    res.json({ message: "Lead converted & commission added" });

  } catch (error) {
    res.status(500).json({ error: "Error converting lead" });
  }
});


// ================= DELETE LEAD =================
router.delete("/leads/:id", async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: "Lead deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting lead" });
  }
});


export default router;