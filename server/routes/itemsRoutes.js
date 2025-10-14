// routes/itemsRoute.js
import express from "express";
import getPool from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware: require valid JWT & admin-ish payload
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing Authorization" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY || "default_secret");
    // many systems store admin flags differently — allow multiple possibilities
    if (
      !(
        payload.is_admin === 1 ||
        payload.role === "admin" ||
        payload.isAdmin === true ||
        payload.id === 1
      )
    ) {
      return res.status(403).json({ error: "Forbidden — admin only" });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// GET /items -> returns categories with items: [{ id, name, items: [...] }, ...]
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const [cats] = await pool.query("SELECT id, name FROM category ORDER BY id");
    const [items] = await pool.query("SELECT id, name, description, price, category_id FROM items ORDER BY id");

    // group items by category
    const categoryMap = cats.map((c) => ({ id: c.id, name: c.name, items: [] }));
    const mapById = new Map(categoryMap.map((c) => [c.id, c]));

    for (const it of items) {
      const cat = mapById.get(it.category_id) ?? null;
      if (cat) cat.items.push(it);
      else {
        // items with no category -> put into an "Uncategorized" bucket
        let unc = mapById.get(0);
        if (!unc) {
          unc = { id: 0, name: "Uncategorized", items: [] };
          categoryMap.push(unc);
          mapById.set(0, unc);
        }
        unc.items.push(it);
      }
    }

    res.json(categoryMap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /items (admin) -> accepts { name, description, price, category_id }
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, description = null, price = 0, category_id = null } = req.body;
    if (!name || name.toString().trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }
    const pool = await getPool();
    const [result] = await pool.query(
      "INSERT INTO items (name, description, price, category_id) VALUES (?, ?, ?, ?)",
      [name, description, price, category_id]
    );
    const [rows] = await pool.query("SELECT id, name, description, price, category_id FROM items WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /items/:id (admin) -> may change category_id
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description = null, price = 0, category_id = null } = req.body;
    if (!name || name.toString().trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }
    const pool = await getPool();
    await pool.query(
      "UPDATE items SET name = ?, description = ?, price = ?, category_id = ? WHERE id = ?",
      [name, description, price, category_id, id]
    );
    const [rows] = await pool.query("SELECT id, name, description, price, category_id FROM items WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /items/:id (admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const pool = await getPool();
    const [result] = await pool.query("DELETE FROM items WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
