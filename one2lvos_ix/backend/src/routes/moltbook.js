import express from "express";
import { moltbookGet } from "../lib/moltbook.js";

const router = express.Router();

router.get("/me", async (_req, res) => {
  try {
    const profile = await moltbookGet("agents/me");
    res.json({ ok: true, profile });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

export default router;
