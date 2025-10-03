// server/routes/roomsRoute.js
import express from "express";
import multer from "multer";
import getPool from "../db.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /rooms -> returns { data: [...] } using the DB's `room` table
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      "SELECT id, title, description, area, image, image_mimetype, created_at, price, type_id, status_id FROM room ORDER BY id DESC"
    );

    const data = (rows || []).map((r) => {
      const base = {
        id: r.id,
        title: r.title,
        description: r.description,
        area: r.area,
        created_at: r.created_at,
        price: r.price != null ? Number(r.price) : null,
        // we don't know your type/status tables, so expose the IDs
        type_id: r.type_id ?? null,
        status_id: r.status_id ?? null,
      };

      if (r.image) {
        const mimetype = r.image_mimetype || "application/octet-stream";
        const base64 = Buffer.from(r.image).toString("base64");
        return { ...base, image: `data:${mimetype};base64,${base64}` };
      }
      return { ...base, image: null };
    });

    res.json({ data });
  } catch (err) {
    console.error("GET /rooms error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// GET /rooms/:id/image -> raw image bytes
router.get("/:id/image", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send("Missing id");
    const pool = await getPool();
    const [rows] = await pool.query("SELECT image, image_mimetype FROM room WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0 || !rows[0].image) return res.status(404).send("Not found");
    res.setHeader("Content-Type", rows[0].image_mimetype || "application/octet-stream");
    res.send(rows[0].image);
  } catch (err) {
    console.error("GET /rooms/:id/image error:", err);
    res.status(500).send("Server error");
  }
});

// POST /rooms -> create room (multipart form-data; 'image' optional)
// Accepts fields: title (required), description, area, price, type_id, status_id
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, area, price, type_id, status_id } = req.body;
    if (!title) return res.status(400).json({ message: "Missing title" });

    const pool = await getPool();
    if (req.file) {
      const sql =
        "INSERT INTO room (title, description, area, price, type_id, status_id, image, image_mimetype) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      const params = [
        title,
        description || null,
        area || null,
        price || null,
        type_id ? Number(type_id) : null,
        status_id ? Number(status_id) : null,
        req.file.buffer,
        req.file.mimetype,
      ];
      const [result] = await pool.query(sql, params);
      return res.status(201).json({ id: result.insertId });
    } else {
      const [result] = await pool.query(
        "INSERT INTO room (title, description, area, price, type_id, status_id) VALUES (?, ?, ?, ?, ?, ?)",
        [title, description || null, area || null, price || null, type_id ? Number(type_id) : null, status_id ? Number(status_id) : null]
      );
      return res.status(201).json({ id: result.insertId });
    }
  } catch (err) {
    console.error("POST /rooms error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// PUT /rooms/:id -> update (multipart form-data; omit image to keep old)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Missing id" });

    const { title, description, area, price, type_id, status_id } = req.body;
    if (!title) return res.status(400).json({ message: "Missing title" });

    const pool = await getPool();
    if (req.file) {
      await pool.query(
        "UPDATE room SET title = ?, description = ?, area = ?, price = ?, type_id = ?, status_id = ?, image = ?, image_mimetype = ? WHERE id = ?",
        [title, description || null, area || null, price || null, type_id ? Number(type_id) : null, status_id ? Number(status_id) : null, req.file.buffer, req.file.mimetype, id]
      );
    } else {
      await pool.query(
        "UPDATE room SET title = ?, description = ?, area = ?, price = ?, type_id = ?, status_id = ? WHERE id = ?",
        [title, description || null, area || null, price || null, type_id ? Number(type_id) : null, status_id ? Number(status_id) : null, id]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /rooms/:id error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// DELETE /rooms/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Missing id" });
    const pool = await getPool();
    await pool.query("DELETE FROM room WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /rooms/:id error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
