// routes/reviewRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import getPool from "../db.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// ensure uploads/reviews exists
const uploadsDir = path.join(process.cwd(), "uploads", "reviews");
fs.mkdirSync(uploadsDir, { recursive: true });

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// GET /reviews  (public)
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT id, name, description, photo FROM reviews ORDER BY id DESC");
    const reviews = rows.map((r) => {
      let photo = null;
      if (r.photo) {
        try { photo = r.photo.toString(); } catch { photo = null; }
      }
      return { id: r.id, name: r.name, description: r.description, photo };
    });
    res.json({ ok: true, reviews });
  } catch (err) {
    console.error("GET /reviews error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// POST /reviews  (admin) - multipart/form-data (name, description, optional photo)
router.post("/", adminAuth, upload.single("photo"), async (req, res) => {
  try {
    const pool = await getPool();
    const { name, description } = req.body;
    const photoPath = req.file ? `/uploads/reviews/${req.file.filename}` : null;
    const photoBuffer = photoPath ? Buffer.from(photoPath) : null;

    const [result] = await pool.query(
      "INSERT INTO reviews (name, description, photo) VALUES (?, ?, ?)",
      [name || "Anonymous", description || "", photoBuffer]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("POST /reviews error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// PUT /reviews/:id  (admin) - multipart/form-data (optional photo)
router.put("/:id", adminAuth, upload.single("photo"), async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const [existingRows] = await pool.query("SELECT name, description, photo FROM reviews WHERE id = ? LIMIT 1", [id]);
    if (!existingRows || existingRows.length === 0) return res.status(404).json({ ok: false, error: "Not found" });

    const existing = existingRows[0];
    const { name, description } = req.body;
    let photoBuffer = existing.photo; // keep existing by default

    if (req.file) {
      const newPath = `/uploads/reviews/${req.file.filename}`;
      photoBuffer = Buffer.from(newPath);

      // attempt to delete old file if it looks like a path
      try {
        if (existing.photo) {
          const oldPath = existing.photo.toString();
          if (oldPath.startsWith("/uploads/")) {
            const realPath = path.join(process.cwd(), oldPath);
            if (fs.existsSync(realPath)) fs.unlinkSync(realPath);
          }
        }
      } catch (e) { /* ignore unlink errors */ }
    }

    await pool.query(
      "UPDATE reviews SET name = ?, description = ?, photo = ? WHERE id = ?",
      [name || existing.name, description || existing.description, photoBuffer, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /reviews/:id error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// DELETE /reviews/:id  (admin)
router.delete("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT photo FROM reviews WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, error: "Not found" });

    const existing = rows[0];
    try {
      if (existing.photo) {
        const oldPath = existing.photo.toString();
        if (oldPath.startsWith("/uploads/")) {
          const realPath = path.join(process.cwd(), oldPath);
          if (fs.existsSync(realPath)) fs.unlinkSync(realPath);
        }
      }
    } catch (e) { /* ignore unlink errors */ }

    await pool.query("DELETE FROM reviews WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /reviews/:id error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
