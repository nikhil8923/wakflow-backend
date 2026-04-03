import express from "express";
import Lead from "../models/Lead.js";

const router = express.Router();

// Save Lead
router.post("/send-lead", async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();
    res.status(200).json({ message: "Lead saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving lead" });
  }
});

// Get All Leads (for Admin)
router.get("/leads", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Error fetching leads" });
  }
});

// Delete Lead
router.delete("/leads/:id", async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: "Lead deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting lead" });
  }
});

export default router;