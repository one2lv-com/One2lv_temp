import express from "express";
import { requireAuth } from "../lib/auth.js";
import { readWorkspaceFile, writeWorkspaceFile } from "../lib/fs-guard.js";

const router = express.Router();

router.get("/read", requireAuth, (req, res) => {
  try {
    const path = String(req.query.path || "notes.txt");
    res.json({ ok: true, path, content: readWorkspaceFile(path) });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/write", requireAuth, (req, res) => {
  try {
    const { path, content } = req.body || {};
    const result = writeWorkspaceFile(String(path || "notes.txt"), String(content || ""));
    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

export default router;
