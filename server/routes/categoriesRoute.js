
import express from "express";
import getPool from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing Authorization" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY || "default_secret");
    if (!(payload.is_admin === 1 || payload.role === "admin" || payload.isAdmin === true || payload.id === 1)) {
      return res.status(403).json({ error: "Forbidden — admin only" });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// GET /categories
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT id, name FROM category ORDER BY id");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /categories  (admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.toString().trim()) return res.status(400).json({ error: "Name is required" });

    const pool = await getPool();
    const [result] = await pool.query("INSERT INTO category (name) VALUES (?)", [name.trim()]);
    const [rows] = await pool.query("SELECT id, name FROM category WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /categories/:id (admin)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { name } = req.body;
    if (!name || !name.toString().trim()) return res.status(400).json({ error: "Name is required" });

    const pool = await getPool();
    await pool.query("UPDATE category SET name = ? WHERE id = ?", [name.trim(), id]);
    const [rows] = await pool.query("SELECT id, name FROM category WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /categories/:id (admin) -> set items.category_id = NULL then delete category
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const pool = await getPool();

    // disassociate items first (set to NULL)
    await pool.query("UPDATE items SET category_id = NULL WHERE category_id = ?", [id]);

    const [result] = await pool.query("DELETE FROM category WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Category not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
