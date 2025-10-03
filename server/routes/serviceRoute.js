
import express from "express";
import multer from "multer";
import getPool from "../db.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // keep in-memory and store to DB


router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT id, title, icon IS NOT NULL AS has_icon FROM services ORDER BY id DESC");
    const services = await Promise.all(rows.map(async (r) => {
      if (!r.has_icon) return { id: r.id, title: r.title, icon: null };
      // fetch blob for this row
      const [b] = await pool.query("SELECT icon, icon_mimetype FROM services WHERE id = ? LIMIT 1", [r.id]);
      if (!b || b.length === 0 || !b[0].icon) return { id: r.id, title: r.title, icon: null };
      const mimetype = b[0].icon_mimetype || "image/png";
      const base64 = Buffer.from(b[0].icon).toString("base64");
      return { id: r.id, title: r.title, icon: `data:${mimetype};base64,${base64}` };
    }));
    res.json({ data: services });
  } catch (err) {
    console.error("GET /services error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// POST /services
router.post("/", upload.single("icon"), async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Missing title" });

    const pool = await getPool();

    if (req.file) {
      // store blob + mimetype
      const sql = "INSERT INTO services (title, icon, icon_mimetype) VALUES (?, ?, ?)";
      const params = [title, req.file.buffer, req.file.mimetype];
      const [result] = await pool.query(sql, params);
      return res.status(201).json({ id: result.insertId });
    } else {
      const [result] = await pool.query("INSERT INTO services (title) VALUES (?)", [title]);
      return res.status(201).json({ id: result.insertId });
    }
  } catch (err) {
    console.error("POST /services error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// PUT /services/:id
router.put("/:id", upload.single("icon"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title } = req.body;
    if (!id || !title) return res.status(400).json({ message: "Missing id or title" });

    const pool = await getPool();
    if (req.file) {
      await pool.query("UPDATE services SET title = ?, icon = ?, icon_mimetype = ? WHERE id = ?", [
        title,
        req.file.buffer,
        req.file.mimetype,
        id,
      ]);
    } else {
      await pool.query("UPDATE services SET title = ? WHERE id = ?", [title, id]);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /services/:id error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// DELETE /services/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Missing id" });
    const pool = await getPool();
    await pool.query("DELETE FROM services WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /services/:id error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Optional: GET /services/:id/image -> returns raw image bytes (useful if frontend uses /services/:id/image)
router.get("/:id/image", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send("Missing id");
    const pool = await getPool();
    const [rows] = await pool.query("SELECT icon, icon_mimetype FROM services WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0 || !rows[0].icon) return res.status(404).send("Not found");
    const r = rows[0];
    res.setHeader("Content-Type", r.icon_mimetype || "application/octet-stream");
    res.send(r.icon); // icon is a Buffer
  } catch (err) {
    console.error("GET /services/:id/image error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
