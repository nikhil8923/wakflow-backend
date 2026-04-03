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
    console.log(error);
    res.status(500).json({ error: "Error saving lead" });
  }
});

export default router;